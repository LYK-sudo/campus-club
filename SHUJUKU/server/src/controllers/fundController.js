const { query, transaction } = require('../config/database');

const getFundRecords = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, club_id, type, category } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT f.*, c.name as club_name, u.name as operator_name 
                   FROM fund_records f 
                   JOIN clubs c ON f.club_id = c.id 
                   JOIN users u ON f.operator_id = u.id 
                   WHERE 1=1`;
        let countSql = `SELECT COUNT(*) as total FROM fund_records WHERE 1=1`;
        const params = [];
        const countParams = [];

        if (club_id) {
            sql += ` AND f.club_id = ?`;
            countSql += ` AND club_id = ?`;
            params.push(club_id);
            countParams.push(club_id);
        }

        if (type) {
            sql += ` AND f.type = ?`;
            countSql += ` AND type = ?`;
            params.push(type);
            countParams.push(type);
        }

        if (category) {
            sql += ` AND f.category = ?`;
            countSql += ` AND category = ?`;
            params.push(category);
            countParams.push(category);
        }

        sql += ` ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const records = await query(sql, params);
        const totalResult = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                list: records,
                total: totalResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取经费记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取经费记录失败'
        });
    }
};

const createFundRecord = async (req, res) => {
    try {
        const { club_id, type, amount, category, description, receipt_url, need_approval = true } = req.body;

        if (!club_id || !type || !amount || !category) {
            return res.status(400).json({
                success: false,
                message: '社团、类型、金额和分类为必填项'
            });
        }

        if (need_approval && amount >= 500) {
            const result = await transaction(async (conn) => {
                const [fundResult] = await conn.execute(
                    `INSERT INTO fund_records (club_id, type, amount, category, description, operator_id, receipt_url) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [club_id, type, amount, category, description, req.user.id, receipt_url]
                );

                await conn.execute(
                    `INSERT INTO approvals (type, ref_id, club_id, applicant_id, status, apply_reason, applied_at) 
                     VALUES ('fund', ?, ?, ?, 'pending', ?, NOW())`,
                    [fundResult.insertId, club_id, req.user.id, `${type === 'income' ? '收入' : '支出'}申请：${category} ${amount}元`]
                );

                return fundResult;
            });

            res.status(201).json({
                success: true,
                message: '经费记录已创建，等待审批',
                data: { id: result.insertId }
            });
        } else {
            const result = await transaction(async (conn) => {
                const [fundResult] = await conn.execute(
                    `INSERT INTO fund_records (club_id, type, amount, category, description, operator_id, receipt_url) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [club_id, type, amount, category, description, req.user.id, receipt_url]
                );

                if (type === 'income') {
                    await conn.execute(
                        'UPDATE clubs SET budget = budget + ? WHERE id = ?',
                        [amount, club_id]
                    );
                } else {
                    await conn.execute(
                        'UPDATE clubs SET budget = budget - ? WHERE id = ?',
                        [amount, club_id]
                    );
                }

                return fundResult;
            });

            res.status(201).json({
                success: true,
                message: '经费记录创建成功',
                data: { id: result.insertId }
            });
        }
    } catch (error) {
        console.error('创建经费记录错误:', error);
        res.status(500).json({
            success: false,
            message: '创建经费记录失败'
        });
    }
};

const getFundSummary = async (req, res) => {
    try {
        const { club_id } = req.query;

        const summary = await query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COUNT(*) as total_records
             FROM fund_records WHERE club_id = ?`,
            [club_id]
        );

        const byCategory = await query(
            `SELECT category, type, SUM(amount) as total 
             FROM fund_records 
             WHERE club_id = ? 
             GROUP BY category, type`,
            [club_id]
        );

        const monthly = await query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
             FROM fund_records 
             WHERE club_id = ? 
             GROUP BY DATE_FORMAT(created_at, '%Y-%m') 
             ORDER BY month DESC 
             LIMIT 12`,
            [club_id]
        );

        res.json({
            success: true,
            data: {
                summary: summary[0],
                byCategory,
                monthly: monthly.reverse()
            }
        });
    } catch (error) {
        console.error('获取经费统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取经费统计失败'
        });
    }
};

module.exports = {
    getFundRecords,
    createFundRecord,
    getFundSummary
};
