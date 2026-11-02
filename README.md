# TradeX

TradeX is a React and Express trading workspace. New accounts are free to create. Their wallet starts at KES 0; account registration never starts a payment.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add the server configuration you need.
3. Start the app with `npm run dev`.

The development command starts the Vite app and the Express API. The API creates its SQLite database under `server/data` by default.

## M-Pesa wallet deposits

Deposits use Safaricom Daraja M-Pesa Express (Lipa na M-Pesa Online). Create a Daraja account and an M-Pesa Express app in the [Safaricom Daraja developer portal](https://developer.safaricom.co.ke/apis/MpesaExpressSimulate), then copy the credentials into the server's root `.env` file. Start with sandbox credentials and `DARAJA_ENV=sandbox`. Never put the consumer key, secret, or passkey in frontend code or commit them.

Set `DARAJA_CALLBACK_URL` to a publicly reachable HTTPS address that ends in `/api/payments/mpesa/callback`. Safaricom cannot call a localhost URL. Local development needs an HTTPS tunnel or deployed test server, and the URL must match the callback URL registered for the Daraja app.

The wallet sends an STK Push for a whole-number amount from KES 1 to KES 250,000. The server records the request, accepts the asynchronous callback, checks the callback amount, phone, receipt, and request IDs, then queries Daraja before crediting the wallet. Repeated callbacks and status checks cannot credit the same payment twice. If the Daraja credentials are missing or invalid, the API returns an error; it does not simulate a payment or add funds.

To enable live payments, set `DARAJA_ENV=production` and use the production consumer credentials, shortcode, passkey, and PayBill/Till transaction type issued for your approved Safaricom integration. Production payments also need a live callback URL. Set `TRADEX_ADMIN_PASSWORD` to a unique password of 16 to 128 characters before exposing the admin panel.

## Admin panel

Set `TRADEX_ADMIN_PASSWORD` in the server environment or local `.env` file, then restart the server. Keep this value private and do not commit it. The admin panel is available from the administrator access link on the sign-in screen and from the Admin item in the signed-in workspace. It uses a separate, short-lived admin session; deleting an account also revokes that account's active sessions.
# Tradex
