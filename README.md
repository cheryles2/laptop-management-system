# Laptop Sales Manager

Website quan ly ban laptop da tach thanh 2 thu muc:

- frontend: giao dien quan tri
- backend: API + tich hop thanh toan/van chuyen/dang nhap social

## Tinh nang

- CRUD san pham laptop
- Tao don hang va tru ton kho
- Thanh toan: VNPay, MoMo
- Van chuyen: GHN, GHTK
- Dang nhap social: Google, Facebook
- Dashboard thong ke doanh thu, ton kho

## Cau truc

```text
.
|-- frontend/
|   |-- index.html
|   |-- app.js
|   `-- styles.css
|-- backend/
|   |-- server.js
|   |-- package.json
|   |-- .env.example
|   `-- data/store.json
`-- package.json
```

## Chay du an

1. Cai dependencies backend:

```bash
npm run install:all
```

2. Chay app:

```bash
npm start
```

3. Mo trinh duyet:

- http://localhost:3000

## Cau hinh key that

Copy file backend/.env.example thanh backend/.env va dien API key:

- Database MySQL (Railway/Render): DATABASE_URL
- Neu nha cung cap bat buoc SSL: DB_SSL=true

- VNPay: VNPAY_TMN_CODE, VNPAY_HASH_SECRET
- MoMo: MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY
- GHN: GHN_TOKEN, GHN_SHOP_ID
- GHTK: GHTK_TOKEN
- Google OAuth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
- Facebook OAuth: FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET

Neu chua co key, he thong tu dong chay mock mode de test luong nghiep vu.

## Deploy Render + Railway

Dat env cho service backend tren Render:

- BACKEND_URL=https://laptop-management-system-oy7i.onrender.com
- FRONTEND_URL=<url frontend production>
- DATABASE_URL=mysql://root:password@host:port/railway
- DB_SSL=true (neu database bat buoc SSL)

Backend se tu dong tao bang products, orders, order_items va seed du lieu mau khi bang products rong.
