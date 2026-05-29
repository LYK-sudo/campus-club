const { query, transaction } = require('../config/database');

const getEquipment = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, category, keyword, owner_club_id } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT e.*, c.name as owner_club_name 
                   FROM equipment e 
                   LEFT JOIN clubs c ON e.owner_club_id = c.id 
                   WHERE 1=1`;
        let countSql = `SELECT COUNT(*) as total FROM equipment WHERE 1=1`;
        const params = [];
        const countParams = [];

        if (category) {
            sql += ` AND e.category = ?`;
            countSql += ` AND category = ?`;
            params.push(category);
            countParams.push(category);
        }

        if (keyword) {
            sql += ` AND e.name LIKE ?`;
            countSql += ` AND name LIKE ?`;
            params.push(`%${keyword}%`);
            countParams.push(`%${keyword}%`);
        }

        if (owner_club_id) {
            sql += ` AND e.owner_club_id = ?`;
            countSql += ` AND owner_club_id = ?`;
            params.push(owner_club_id);
            countParams.push(owner_club_id);
        }

        sql += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const equipment = await query(sql, params);
        const totalResult = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                list: equipment,
                total: totalResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取物资列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取物资列表失败'
        });
    }
};

const createEquipment = async (req, res) => {
    try {
        const { name, category, total_count, owner_club_id, description, image_url } = req.body;

        const result = await query(
            `INSERT INTO equipment (name, category, total_count, available_count, owner_club_id, description, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, category || '其他', total_count || 1, total_count || 1, owner_club_id, description, image_url]
        );

        res.status(201).json({
            success: true,
            message: '物资创建成功',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('创建物资错误:', error);
        res.status(500).json({
            success: false,
            message: '创建物资失败'
        });
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, total_count, condition_status, description, image_url } = req.body;

        await query(
            `UPDATE equipment SET 
                name = COALESCE(?, name),
                category = COALESCE(?, category),
                total_count = COALESCE(?, total_count),
                condition_status = COALESCE(?, condition_status),
                description = COALESCE(?, description),
                image_url = COALESCE(?, image_url)
            WHERE id = ?`,
            [name, category, total_count, condition_status, description, image_url, id]
        );

        res.json({
            success: true,
            message: '物资更新成功'
        });
    } catch (error) {
        console.error('更新物资错误:', error);
        res.status(500).json({
            success: false,
            message: '更新物资失败'
        });
    }
};

const getBorrowRecords = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, status, club_id } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT b.*, e.name as equipment_name, e.category,
                          c.name as club_name, u.name as applicant_name
                   FROM borrow_records b 
                   JOIN equipment e ON b.equipment_id = e.id 
                   JOIN clubs c ON b.club_id = c.id 
                   JOIN users u ON b.applicant_id = u.id 
                   WHERE 1=1`;
        const params = [];

        if (status) {
            sql += ` AND b.status = ?`;
            params.push(status);
        }

        if (club_id) {
            sql += ` AND b.club_id = ?`;
            params.push(club_id);
        }

        sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const records = await query(sql, params);

        res.json({
            success: true,
            data: {
                list: records,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取借用记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取借用记录失败'
        });
    }
};

const borrowEquipment = async (req, res) => {
    try {
        const { equipment_id, club_id, quantity, borrow_date, return_date, reason } = req.body;

        const equipment = await query(
            'SELECT * FROM equipment WHERE id = ? AND available_count >= ?',
            [equipment_id, quantity]
        );

        if (equipment.length === 0) {
            return res.status(400).json({
                success: false,
                message: '物资不存在或数量不足'
            });
        }

        const result = await transaction(async (conn) => {
            const [borrowResult] = await conn.execute(
                `INSERT INTO borrow_records (equipment_id, club_id, applicant_id, quantity, borrow_date, return_date, status) 
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [equipment_id, club_id, req.user.id, quantity, borrow_date, return_date]
            );

            await conn.execute(
                `INSERT INTO approvals (type, ref_id, club_id, applicant_id, status, apply_reason, applied_at) 
                 VALUES ('equipment', ?, ?, ?, 'pending', ?, NOW())`,
                [borrowResult.insertId, club_id, req.user.id, reason || `申请借用物资：${equipment[0].name}`]
            );

            return borrowResult;
        });

        res.status(201).json({
            success: true,
            message: '借用申请已提交',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('借用物资错误:', error);
        res.status(500).json({
            success: false,
            message: '借用申请失败'
        });
    }
};

const returnEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { damage_note } = req.body;

        const borrow = await query(
            'SELECT * FROM borrow_records WHERE id = ? AND status = "borrowed"',
            [id]
        );

        if (borrow.length === 0) {
            return res.status(404).json({
                success: false,
                message: '借用记录不存在或状态不正确'
            });
        }

        await transaction(async (conn) => {
            await conn.execute(
                `UPDATE borrow_records SET status = 'returned', actual_return_date = CURDATE(), damage_note = ? WHERE id = ?`,
                [damage_note, id]
            );

            await conn.execute(
                'UPDATE equipment SET available_count = available_count + ? WHERE id = ?',
                [borrow[0].quantity, borrow[0].equipment_id]
            );
        });

        res.json({
            success: true,
            message: '物资已归还'
        });
    } catch (error) {
        console.error('归还物资错误:', error);
        res.status(500).json({
            success: false,
            message: '归还失败'
        });
    }
};

module.exports = {
    getEquipment,
    createEquipment,
    updateEquipment,
    getBorrowRecords,
    borrowEquipment,
    returnEquipment
};
