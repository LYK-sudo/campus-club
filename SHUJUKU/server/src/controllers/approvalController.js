const { query, transaction } = require('../config/database');

const getApprovals = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, type, status, club_id } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT a.*, c.name as club_name, 
                          u1.name as applicant_name, u1.student_no as applicant_no,
                          u2.name as approver_name
                   FROM approvals a 
                   JOIN clubs c ON a.club_id = c.id 
                   JOIN users u1 ON a.applicant_id = u1.id 
                   LEFT JOIN users u2 ON a.approver_id = u2.id 
                   WHERE 1=1`;
        let countSql = `SELECT COUNT(*) as total FROM approvals WHERE 1=1`;
        const params = [];
        const countParams = [];

        if (req.user.role === 'teacher' || req.user.role === 'super_admin') {
            if (status === 'pending') {
                sql += ` AND a.status = 'pending'`;
                countSql += ` AND status = 'pending'`;
            }
        } else {
            const userClubIds = req.user.clubs.map(c => c.clubId);
            if (userClubIds.length > 0) {
                sql += ` AND (a.club_id IN (${userClubIds.join(',')}) OR a.applicant_id = ?)`;
                countSql += ` AND (club_id IN (${userClubIds.join(',')}) OR applicant_id = ?)`;
                params.push(req.user.id);
                countParams.push(req.user.id);
            } else {
                sql += ` AND a.applicant_id = ?`;
                countSql += ` AND applicant_id = ?`;
                params.push(req.user.id);
                countParams.push(req.user.id);
            }
        }

        if (type) {
            sql += ` AND a.type = ?`;
            countSql += ` AND type = ?`;
            params.push(type);
            countParams.push(type);
        }

        if (status) {
            sql += ` AND a.status = ?`;
            countSql += ` AND status = ?`;
            params.push(status);
            countParams.push(status);
        }

        if (club_id) {
            sql += ` AND a.club_id = ?`;
            countSql += ` AND club_id = ?`;
            params.push(club_id);
            countParams.push(club_id);
        }

        sql += ` ORDER BY a.applied_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const approvals = await query(sql, params);
        const totalResult = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                list: approvals,
                total: totalResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取审批列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取审批列表失败'
        });
    }
};

const getApprovalById = async (req, res) => {
    try {
        const { id } = req.params;

        const approvals = await query(
            `SELECT a.*, c.name as club_name, 
                    u1.name as applicant_name, u1.student_no as applicant_no,
                    u2.name as approver_name
             FROM approvals a 
             JOIN clubs c ON a.club_id = c.id 
             JOIN users u1 ON a.applicant_id = u1.id 
             LEFT JOIN users u2 ON a.approver_id = u2.id 
             WHERE a.id = ?`,
            [id]
        );

        if (approvals.length === 0) {
            return res.status(404).json({
                success: false,
                message: '审批记录不存在'
            });
        }

        const approval = approvals[0];

        if (approval.type === 'activity') {
            const activity = await query(
                'SELECT * FROM activities WHERE id = ?',
                [approval.ref_id]
            );
            approval.detail = activity[0] || null;
        } else if (approval.type === 'fund') {
            const fund = await query(
                'SELECT * FROM fund_records WHERE id = ?',
                [approval.ref_id]
            );
            approval.detail = fund[0] || null;
        } else if (approval.type === 'equipment') {
            const borrow = await query(
                'SELECT * FROM borrow_records WHERE id = ?',
                [approval.ref_id]
            );
            approval.detail = borrow[0] || null;
        }

        res.json({
            success: true,
            data: approval
        });
    } catch (error) {
        console.error('获取审批详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取审批详情失败'
        });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const approvals = await query(
            'SELECT * FROM approvals WHERE id = ? AND status = "pending"',
            [id]
        );

        if (approvals.length === 0) {
            return res.status(404).json({
                success: false,
                message: '审批记录不存在或已处理'
            });
        }

        const approval = approvals[0];

        await transaction(async (conn) => {
            await conn.execute(
                `UPDATE approvals SET status = 'approved', approver_id = ?, reviewed_at = NOW() WHERE id = ?`,
                [req.user.id, id]
            );

            if (approval.type === 'activity') {
                await conn.execute(
                    'UPDATE activities SET status = "approved" WHERE id = ?',
                    [approval.ref_id]
                );
            } else if (approval.type === 'fund') {
                const funds = await query('SELECT * FROM fund_records WHERE id = ?', [approval.ref_id]);
                if (funds.length > 0) {
                    const fund = funds[0];
                    if (fund.type === 'income') {
                        await conn.execute(
                            'UPDATE clubs SET budget = budget + ? WHERE id = ?',
                            [fund.amount, fund.club_id]
                        );
                    } else {
                        await conn.execute(
                            'UPDATE clubs SET budget = budget - ? WHERE id = ?',
                            [fund.amount, fund.club_id]
                        );
                    }
                }
            } else if (approval.type === 'equipment') {
                const borrows = await query('SELECT * FROM borrow_records WHERE id = ?', [approval.ref_id]);
                if (borrows.length > 0) {
                    await conn.execute(
                        'UPDATE borrow_records SET status = "approved" WHERE id = ?',
                        [approval.ref_id]
                    );
                    await conn.execute(
                        'UPDATE equipment SET available_count = available_count - ? WHERE id = ?',
                        [borrows[0].quantity, borrows[0].equipment_id]
                    );
                }
            }
        });

        res.json({
            success: true,
            message: '审批通过'
        });
    } catch (error) {
        console.error('审批通过错误:', error);
        res.status(500).json({
            success: false,
            message: '审批失败'
        });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reject_reason } = req.body;

        if (!reject_reason) {
            return res.status(400).json({
                success: false,
                message: '请填写驳回原因'
            });
        }

        const approvals = await query(
            'SELECT * FROM approvals WHERE id = ? AND status = "pending"',
            [id]
        );

        if (approvals.length === 0) {
            return res.status(404).json({
                success: false,
                message: '审批记录不存在或已处理'
            });
        }

        const approval = approvals[0];

        await transaction(async (conn) => {
            await conn.execute(
                `UPDATE approvals SET status = 'rejected', approver_id = ?, reject_reason = ?, reviewed_at = NOW() WHERE id = ?`,
                [req.user.id, reject_reason, id]
            );

            if (approval.type === 'activity') {
                await conn.execute(
                    'UPDATE activities SET status = "rejected" WHERE id = ?',
                    [approval.ref_id]
                );
            } else if (approval.type === 'equipment') {
                await conn.execute(
                    'UPDATE borrow_records SET status = "rejected" WHERE id = ?',
                    [approval.ref_id]
                );
            }
        });

        res.json({
            success: true,
            message: '已驳回'
        });
    } catch (error) {
        console.error('驳回审批错误:', error);
        res.status(500).json({
            success: false,
            message: '驳回失败'
        });
    }
};

module.exports = {
    getApprovals,
    getApprovalById,
    approveRequest,
    rejectRequest
};
