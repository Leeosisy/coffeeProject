-- 品牌表：咖啡 / 奶茶品牌目录
-- 使用库：coffee_db
-- Logo 只存可公网访问的 URL（本地开发可用临时地址，上线前换成 OSS/COS 地址）

CREATE TABLE IF NOT EXISTS `brand` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(100) NOT NULL COMMENT '品牌名称',
  `logo_url` varchar(512) NULL DEFAULT NULL COMMENT '品牌 Logo 线上地址',
  `category` varchar(20) NOT NULL DEFAULT 'tea' COMMENT '分类：tea / coffee / both',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序，越小越靠前',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用：1启用 0停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_brand_name` (`name`) USING BTREE,
  KEY `idx_category_active_sort` (`category`, `is_active`, `sort_order`) USING BTREE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = '咖啡/奶茶品牌表';

-- 可选：给咖啡记录表增加品牌 ID（保留原 brand 文本字段，兼容旧数据）
-- ALTER TABLE `coffee_record`
--   ADD COLUMN `brand_id` int UNSIGNED NULL DEFAULT NULL COMMENT '关联品牌ID' AFTER `brand`,
--   ADD KEY `idx_brand_id` (`brand_id`);

-- 示例数据（logo 可先留空，页面会显示品牌名首字；有 OSS 后再更新 logo_url）
INSERT INTO `brand` (`name`, `logo_url`, `category`, `sort_order`) VALUES
('喜茶', NULL, 'tea', 10),
('奈雪的茶', NULL, 'tea', 20),
('茶百道', NULL, 'tea', 30),
('蜜雪冰城', NULL, 'tea', 40),
('瑞幸', NULL, 'coffee', 50),
('星巴克', NULL, 'coffee', 60)
ON DUPLICATE KEY UPDATE
  `category` = VALUES(`category`),
  `sort_order` = VALUES(`sort_order`),
  `is_active` = 1;
