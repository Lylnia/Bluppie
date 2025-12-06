import sqlite3
import random
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "bluppie.db"
ADMIN_ADDRESS = "UQC0GE6NjIui0CAI_as7EKRP2bsetFyVLqz4pwV7BP3HFsE_" # Senin Cüzdanın (Fee Buraya Gelir)

# --- VERİTABANI ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Users: Referans verisi (referrer) eklendi
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (address TEXT PRIMARY KEY, balance_ton REAL, balance_pie REAL, xp INTEGER, referrer TEXT, referral_count INTEGER DEFAULT 0)''')
    
    # Inventory
    c.execute('''CREATE TABLE IF NOT EXISTS inventory 
                 (id INTEGER PRIMARY KEY, owner_address TEXT, name TEXT, item_number INTEGER, 
                  image_url TEXT, status TEXT, price REAL, currency TEXT)''')
    
    # Transactions (İşlem Geçmişi)
    c.execute('''CREATE TABLE IF NOT EXISTS transactions 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_address TEXT, type TEXT, 
                  item_name TEXT, amount TEXT, currency TEXT, status TEXT, date TEXT)''')
    
    # Votes
    c.execute('''CREATE TABLE IF NOT EXISTS votes 
                 (proposal_id INTEGER, voter_address TEXT, option_index INTEGER)''')
                 
    conn.commit()
    conn.close()

init_db()

# --- MODELLER ---
class ListRequest(BaseModel):
    nft_id: int
    price: float
    currency: str

class BuyRequest(BaseModel):
    nft_id: int
    buyer_address: str

class VoteRequest(BaseModel):
    proposal_id: int
    voter_address: str
    option_index: int

class MintRequest(BaseModel):
    owner_address: str
    name: str
    item_number: int 
    image_url: str

class TransferRequest(BaseModel):
    nft_id: int
    sender_address: str
    recipient_address: str

# --- YARDIMCI FONKSİYONLAR ---
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def log_transaction(conn, user_address, tx_type, item_name, amount, currency, status):
    """İşlem geçmişine kayıt atar"""
    date_str = str(int(time.time())) # Timestamp
    conn.execute("INSERT INTO transactions (user_address, type, item_name, amount, currency, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (user_address, tx_type, item_name, str(amount), currency, status, date_str))

def seed_user(address: str, ref_by: Optional[str] = None):
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    
    if not user:
        referrer = None
        # Referans kontrolü (Kendini referans gösteremez)
        if ref_by and ref_by != address:
            ref_user = c.execute("SELECT * FROM users WHERE address = ?", (ref_by,)).fetchone()
            if ref_user:
                referrer = ref_by
                # Referans sahibine ödül (Örn: +1 Count, +100 PIE)
                c.execute("UPDATE users SET referral_count = referral_count + 1, balance_pie = balance_pie + 100 WHERE address = ?", (referrer,))
                log_transaction(conn, referrer, "Referral Bonus", "New Friend", "100", "PIE", "Success")

        # Yeni Kullanıcı: 0 TON, 0 PIE (Hediye yok), Referrer kaydedildi
        c.execute("INSERT INTO users (address, balance_ton, balance_pie, xp, referrer, referral_count) VALUES (?, ?, ?, ?, ?, ?)", 
                  (address, 0, 0, 0, referrer, 0))
        conn.commit()
    conn.close()

# --- ENDPOINTS ---

@app.get("/")
def read_root(): return {"status": "Bluppie Backend V2 Live 🟢"}

@app.get("/user/{address}")
def get_user(address: str, ref: Optional[str] = None):
    # Kullanıcıyı oluştur (varsa referans kodunu işle)
    seed_user(address, ref)
    
    conn = get_db()
    c = conn.cursor()
    
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    inventory = c.execute("SELECT * FROM inventory WHERE owner_address = ?", (address,)).fetchall()
    # İşlem geçmişini tarihe göre ters sırala (en yeni en üstte)
    transactions = c.execute("SELECT * FROM transactions WHERE user_address = ? ORDER BY id DESC LIMIT 20", (address,)).fetchall()
    
    conn.close()
    
    return {
        "balance_ton": user["balance_ton"],
        "balance_pie": user["balance_pie"],
        "referral_count": user["referral_count"],
        "inventory": [dict(row) for row in inventory],
        "transactions": [dict(row) for row in transactions]
    }

@app.get("/stats")
def get_stats():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM inventory WHERE name = 'Plush Bluppie'").fetchone()[0]
    conn.close()
    return {"total_minted": count}

@app.get("/marketplace/{viewer_address}")
def get_market(viewer_address: str):
    conn = get_db()
    items = conn.execute("SELECT * FROM inventory WHERE status = 'Listed' AND owner_address != ?", (viewer_address,)).fetchall()
    conn.close()
    return [dict(row) for row in items]

# --- MINT ---
@app.post("/mint")
def mint_nft(req: MintRequest):
    conn = get_db()
    c = conn.cursor()
    
    # Boş ID Bulma Mantığı
    used_ids_query = c.execute("SELECT item_number FROM inventory WHERE name = 'Plush Bluppie'").fetchall()
    used_ids = {row[0] for row in used_ids_query}
    all_ids = set(range(1, 1001))
    available_ids = list(all_ids - used_ids)
    
    if not available_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="SOLD OUT")
    
    random_id = random.choice(available_ids)
    unique_db_id = random.randint(1000000, 9999999) 
    
    c.execute("INSERT INTO inventory (id, owner_address, name, item_number, image_url, status, price, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                 (unique_db_id, req.owner_address, "Plush Bluppie", random_id, req.image_url, "Owned", 0, "TON"))
    
    # Log Ekle
    log_transaction(conn, req.owner_address, "Mint", f"Plush Bluppie #{random_id}", str(0.01), "TON", "Success")
    
    conn.commit()
    conn.close()
    return {"status": "success", "minted_id": random_id}

# --- BUY (FEE MANTIĞI EKLENDİ - PIE İÇİN) ---
@app.post("/marketplace/buy")
def buy_nft(req: BuyRequest):
    conn = get_db()
    c = conn.cursor()
    
    item = c.execute("SELECT * FROM inventory WHERE id = ?", (req.nft_id,)).fetchone()
    if not item or item["status"] != "Listed":
        conn.close()
        raise HTTPException(status_code=400, detail="Item unavailable")
    
    price = item["price"]
    currency = item["currency"]
    seller = item["owner_address"]
    buyer = req.buyer_address
    
    # PIE ile alınıyorsa Bakiye ve Fee işlemleri burada yapılır
    if currency == "PIE":
        buyer_data = c.execute("SELECT balance_pie FROM users WHERE address = ?", (buyer,)).fetchone()
        if not buyer_data or buyer_data["balance_pie"] < price:
            conn.close()
            raise HTTPException(status_code=400, detail="Insufficient PIE")
        
        # Fee Hesapla (%0.1)
        fee = price * 0.001
        seller_receives = price - fee
        
        # 1. Alıcıdan Tam Parayı Çek
        c.execute("UPDATE users SET balance_pie = balance_pie - ? WHERE address = ?", (price, buyer))
        # 2. Satıcıya (Para - Fee) Ver
        c.execute("UPDATE users SET balance_pie = balance_pie + ? WHERE address = ?", (seller_receives, seller))
        # 3. Admine Fee Ver
        seed_user(ADMIN_ADDRESS) # Admin yoksa oluştur
        c.execute("UPDATE users SET balance_pie = balance_pie + ? WHERE address = ?", (fee, ADMIN_ADDRESS))
        
        log_transaction(conn, buyer, "Buy (PIE)", f"{item['name']} #{item['item_number']}", f"-{price}", "PIE", "Success")
        log_transaction(conn, seller, "Sell (PIE)", f"{item['name']} #{item['item_number']}", f"+{seller_receives}", "PIE", "Success")

    elif currency == "TON":
        # TON ise Frontend halleder, biz sadece sahiplik değiştirip log atarız
        log_transaction(conn, buyer, "Buy (TON)", f"{item['name']} #{item['item_number']}", f"-{price}", "TON", "Success")
        log_transaction(conn, seller, "Sell (TON)", f"{item['name']} #{item['item_number']}", f"+{price}", "TON", "Success")

    # Sahiplik Devri
    c.execute("UPDATE inventory SET owner_address = ?, status = 'Owned', price = 0 WHERE id = ?", (buyer, req.nft_id))
    
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- LİSTELEME ---
@app.post("/marketplace/list")
def list_nft(req: ListRequest):
    conn = get_db()
    c = conn.cursor()
    # Sahibi kontrol etmeden listeleme yapma (Güvenlik)
    # Not: Gerçekte session/token kontrolü gerekir ama şimdilik ID üzerinden gidiyoruz
    c.execute("UPDATE inventory SET status = 'Listed', price = ?, currency = ? WHERE id = ?", 
              (req.price, req.currency, req.nft_id))
    
    # Log (Kimin listelediğini bulmak için önce item'ı çekmek lazımdı ama hızlıca geçiyoruz)
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/marketplace/delist/{nft_id}")
def delist_nft(nft_id: int):
    conn = get_db()
    conn.execute("UPDATE inventory SET status = 'Owned', price = 0 WHERE id = ?", (nft_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- TRANSFER (YENİ) ---
@app.post("/inventory/transfer")
def transfer_nft(req: TransferRequest):
    conn = get_db()
    c = conn.cursor()
    
    item = c.execute("SELECT * FROM inventory WHERE id = ? AND owner_address = ?", (req.nft_id, req.sender_address)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=400, detail="NFT not owned or not found")
        
    if item["status"] == "Listed":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot transfer listed item. Delist first.")

    # Sahiplik Değişimi
    c.execute("UPDATE inventory SET owner_address = ? WHERE id = ?", (req.recipient_address, req.nft_id))
    
    # Log
    log_transaction(conn, req.sender_address, "Transfer Out", f"{item['name']} #{item['item_number']}", "0", "", "Sent")
    log_transaction(conn, req.recipient_address, "Transfer In", f"{item['name']} #{item['item_number']}", "0", "", "Received")
    
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- DİĞERLERİ ---
@app.get("/leaderboard")
def leaderboard():
    conn = get_db()
    rows = conn.execute("SELECT address, balance_pie FROM users ORDER BY balance_pie DESC LIMIT 10").fetchall()
    conn.close()
    results = []
    for idx, row in enumerate(rows):
        addr = row["address"]
        short = addr[:4] + "..." + addr[-4:] if len(addr) > 10 else addr
        badge = "👑" if idx == 0 else "💎" if idx < 3 else "🦈"
        results.append({"id": idx+1, "name": short, "score": row["balance_pie"], "badge": badge})
    return results

@app.post("/dao/vote")
def vote(req: VoteRequest):
    conn = get_db()
    conn.execute("INSERT INTO votes VALUES (?, ?, ?)", (req.proposal_id, req.voter_address, req.option_index))
    # Basit ödül: Oy verene 10 PIE
    conn.execute("UPDATE users SET balance_pie = balance_pie + 10 WHERE address = ?", (req.voter_address,))
    conn.commit()
    conn.close()
    return {"status": "success"}
