#!/bin/bash

# ===== CONFIG =====
API_URL="http://localhost:5050/api"
USERNAME="TestUser"
EMAIL="${1:-testuser_$(date +%s)@example.com}"
PASSWORD="${2:-Test1234}"
PRODUCT_ID=1
QUANTITY=2

# ===== LOG HEADERS =====
log() {
  echo -e "\n🔹 $1"
}

# ===== REGISTER USER =====
log "Registering test user: $EMAIL"
REGISTER_RES=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$USERNAME"'",
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }')

TOKEN=$(echo "$REGISTER_RES" | grep -o '"token":"[^"]*' | cut -d':' -f2 | tr -d '"')

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  echo "$REGISTER_RES"
  exit 1
fi

echo "✅ Registered and got token"

# ===== ADD TO CART =====
log "Adding product $PRODUCT_ID to cart..."
ADD_CART_RES=$(curl -s -X POST "$API_URL/cart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": '"$PRODUCT_ID"',
    "quantity": '"$QUANTITY"'
  }')
echo "$ADD_CART_RES"

# ===== GET CART =====
log "Viewing cart..."
CART_RES=$(curl -s -X GET "$API_URL/cart" \
  -H "Authorization: Bearer $TOKEN")
echo "$CART_RES"

# ===== CHECKOUT =====
log "Starting checkout..."
CHECKOUT_RES=$(curl -s -X POST "$API_URL/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_info": {
      "name": "Test User",
      "email": "'"$EMAIL"'",
      "address": "123 Test Street"
    },
    "payment_info": {
      "cardNumber": "4242424242424242",
      "expiry": "12/30",
      "cvv": "123"
    }
  }')
echo "$CHECKOUT_RES"

echo -e "\n✅ Done."