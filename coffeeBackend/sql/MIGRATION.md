# 品牌数据：本地 → 云服务器迁移清单

## 1. 本地准备
1. 在本地 MySQL 执行 `sql/brand.sql` 建表并写入品牌
2. 把 Logo 图片准备好（建议正方形 PNG/WebP，边长 200~512px）
3. 本地可先用可访问的临时 URL；正式上线必须换成云存储公网 URL

## 2. 上线前处理图片（重要）
1. 开通对象存储（阿里云 OSS / 腾讯云 COS / 七牛等）
2. 上传全部品牌 Logo
3. 更新本地 `brand.logo_url` 为线上地址，例如：
   ```sql
   UPDATE brand SET logo_url = 'https://cdn.xxx.com/brands/heytea.png' WHERE name = '喜茶';
   ```
4. 确认小程序后台已配置 downloadFile / 图片合法域名

## 3. 迁移数据库到云 MySQL
### 方式 A：只迁品牌表
```bash
mysqldump -u root -p coffee_db brand > brand_backup.sql
# 上传到云服务器后
mysql -u用户 -p 云库名 < brand_backup.sql
```

### 方式 B：整库迁移
```bash
mysqldump -u root -p coffee_db > coffee_db_full.sql
mysql -u用户 -p 云库名 < coffee_db_full.sql
```

### 方式 C：图形工具
Navicat / DBeaver：本地库 → 传输 / 同步到云库

## 4. 云端后端配置
把云服务器 `.env` 指向云 MySQL：
```env
DB_HOST=云数据库地址
DB_PORT=3306
DB_USER=xxx
DB_PASSWORD=xxx
DB_NAME=coffee_db
```

## 5. 验收
```sql
SELECT id, name, logo_url, category, is_active FROM brand ORDER BY sort_order;
```
- 名称正确
- `logo_url` 用浏览器能打开
- 小程序里能正常显示 Logo
