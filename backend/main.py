import sqlite3
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- CORS AYARLARI ---
# Frontend'in (Vercel) Backend ile konuşmasına izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "bluppie.db"

# --- VERİTABANI KURULUMU ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Kullanıcılar: Adres, TON Bakiyesi (Backend takip etmez aslında), PIE Bakiyesi, XP
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (address TEXT PRIMARY KEY, balance_ton REAL, balance_pie REAL, xp INTEGER)''')
    
    # Envanter: NFT'lerin tutulduğu yer
    c.execute('''CREATE TABLE IF NOT EXISTS inventory 
                 (id INTEGER PRIMARY KEY, owner_address TEXT, name TEXT, item_number INTEGER, 
                  image_url TEXT, status TEXT, price REAL, currency TEXT)''')
    
    # Oylamalar
    c.execute('''CREATE TABLE IF NOT EXISTS votes 
                 (proposal_id INTEGER, voter_address TEXT, option_index INTEGER)''')
                 
    conn.commit()
    conn.close()

# Başlangıçta veritabanını oluştur
init_db()

# --- VERİ MODELLERİ (Pydantic) ---
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
    item_number: int  # Frontend'den 0 gelir, biz burada hesaplarız
    image_url: str

# --- YARDIMCI FONKSİYONLAR ---
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Sütun isimleri ile erişim sağlar
    return conn

def seed_user(address: str):
    """Kullanıcı veritabanında yoksa, 0 bakiye ile oluşturur."""
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    if not user:
        # Yeni Kullanıcı: 0 TON, 0 PIE, 0 XP (Hediye YOK)
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?)", (address, 0, 0, 0))
        conn.commit()
    conn.close()

# ==========================================
#              API ENDPOINTS
# ==========================================

@app.get("/")
def read_root():
    return {"status": "Bluppie Backend Live 🟢"}

# --- KULLANICI VERİLERİ ---
@app.get("/user/{address}")
def get_user(address: str):
    seed_user(address) # Kayıtlı değilse oluştur
    conn = get_db()
    c = conn.cursor()
    
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    # Kullanıcının sahip olduğu VEYA satışa koyduğu (Listed) NFT'leri getir
    inventory = c.execute("SELECT * FROM inventory WHERE owner_address = ?", (address,)).fetchall()
    
    conn.close()
    
    return {
        "balance_ton": user["balance_ton"],
        "balance_pie": user["balance_pie"],
        "inventory": [dict(row) for row in inventory],
        "transactions": [] # Şimdilik boş
    }

# --- İSTATİSTİK (PROGRESS BAR İÇİN) ---
@app.get("/stats")
def get_stats():
    conn = get_db()
    # Sadece 'Plush Bluppie' ismindeki NFT'leri say
    count = conn.execute("SELECT COUNT(*) FROM inventory WHERE name = 'Plush Bluppie'").fetchone()[0]
    conn.close()
    return {"total_minted": count}

# --- MINT (SATIN ALMA VE OLUŞTURMA) ---
@app.post("/mint")
def mint_nft(req: MintRequest):
    conn = get_db()
    c = conn.cursor()
    
    # 1. Dolu olan ID'leri bul
    used_ids_query = c.execute("SELECT item_number FROM inventory WHERE name = 'Plush Bluppie'").fetchall()
    used_ids = {row[0] for row in used_ids_query}
    
    # 2. 1 ile 1000 arasında BOŞ olanları hesapla
    all_ids = set(range(1, 1001))
    available_ids = list(all_ids - used_ids)
    
    # 3. Eğer yer kalmadıysa hata fırlat (Sold Out)
    if not available_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="SOLD OUT! Tükendi.")
    
    # 4. Rastgele bir ID seç
    random_id = random.choice(available_ids)
    
    # 5. Veritabanına kaydet
    # Not: 'id' sütunu veritabanındaki benzersiz satır anahtarıdır, 'item_number' ise NFT'nin numarasıdır (#123)
    unique_db_id = random.randint(1000000, 9999999) 
    
    c.execute("INSERT INTO inventory (id, owner_address, name, item_number, image_url, status, price, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                 (unique_db_id, req.owner_address, "Plush Bluppie", random_id, req.image_url, "Owned", 0, "TON"))
    
    conn.commit()
    conn.close()
    
    # Frontend'e hangi numarayı verdiğimizi dönüyoruz
    return {"status": "success", "minted_id": random_id}

# --- MARKETPLACE: LİSTELEME (GÖRÜNTÜLEME) ---
@app.get("/marketplace/{viewer_address}")
def get_market(viewer_address: str):
    conn = get_db()
    # Durumu 'Listed' olan ve sahibi ben OLMAYAN ürünleri getir
    items = conn.execute("SELECT * FROM inventory WHERE status = 'Listed' AND owner_address != ?", (viewer_address,)).fetchall()
    conn.close()
    return [dict(row) for row in items]

# --- MARKETPLACE: SATIŞA KOYMA ---
@app.post("/marketplace/list")
def list_nft(req: ListRequest):
    conn = get_db()
    # NFT var mı kontrol et
    item = conn.execute("SELECT * FROM inventory WHERE id = ?", (req.nft_id,)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="NFT Bulunamadı")
        
    # Durumu 'Listed' yap ve fiyatı güncelle
    conn.execute("UPDATE inventory SET status = 'Listed', price = ?, currency = ? WHERE id = ?", 
                 (req.price, req.currency, req.nft_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- MARKETPLACE: SATIŞTAN ÇEKME ---
@app.post("/marketplace/delist/{nft_id}")
def delist_nft(nft_id: int):
    conn = get_db()
    conn.execute("UPDATE inventory SET status = 'Owned', price = 0 WHERE id = ?", (nft_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- MARKETPLACE: SATIN ALMA ---
@app.post("/marketplace/buy")
def buy_nft(req: BuyRequest):
    conn = get_db()
    c = conn.cursor()
    
    # 1. NFT Kontrolü
    item = c.execute("SELECT * FROM inventory WHERE id = ?", (req.nft_id,)).fetchone()
    if not item or item["status"] != "Listed":
        conn.close()
        raise HTTPException(status_code=400, detail="Ürün artık satışta değil")
    
    price = item["price"]
    currency = item["currency"]
    seller_address = item["owner_address"]
    buyer_address = req.buyer_address
    
    # 2. PIE ile alınıyorsa Bakiye Transferi (Veritabanı üzerinde)
    # TON ile alınıyorsa zaten Frontend cüzdan üzerinden transferi yaptı, burada sadece malı devrediyoruz.
    if currency == "PIE":
        # Alıcının bakiyesine bak
        buyer_data = c.execute("SELECT balance_pie FROM users WHERE address = ?", (buyer_address,)).fetchone()
        if not buyer_data or buyer_data["balance_pie"] < price:
            conn.close()
            raise HTTPException(status_code=400, detail="Yetersiz PIE Bakiyesi")
        
        # Satıcının kaydı var mı bak
        seed_user(seller_address) 
        
        # Transfer: Alıcıdan düş, Satıcıya ekle
        c.execute("UPDATE users SET balance_pie = balance_pie - ? WHERE address = ?", (price, buyer_address))
        c.execute("UPDATE users SET balance_pie = balance_pie + ? WHERE address = ?", (price, seller_address))

    # 3. Sahiplik Devri
    c.execute("UPDATE inventory SET owner_address = ?, status = 'Owned', price = 0 WHERE id = ?", 
              (buyer_address, req.nft_id))
    
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- LEADERBOARD ---
@app.get("/leaderboard")
def leaderboard():
    conn = get_db()
    # PIE miktarına göre sırala
    rows = conn.execute("SELECT address, balance_pie FROM users ORDER BY balance_pie DESC LIMIT 10").fetchall()
    conn.close()
    
    results = []
    for idx, row in enumerate(rows):
        addr = row["address"]
        # Adresi kısalt (UQC...123)
        short = addr[:4] + "..." + addr[-4:] if len(addr) > 10 else addr
        
        # Rozet ata
        badge = "👑" if idx == 0 else "💎" if idx < 3 else "🦈"
        
        results.append({
            "id": idx+1, 
            "name": short, 
            "score": row["balance_pie"], 
            "badge": badge
        })
        
    return results

# --- DAO OYLAMA ---
@app.post("/dao/vote")
def vote(req: VoteRequest):
    conn = get_db()
    # Basitçe oyu kaydet (Aynı kişi 2 kere verebilir şu an, istersen engel koyarız)
    conn.execute("INSERT INTO votes VALUES (?, ?, ?)", (req.proposal_id, req.voter_address, req.option_index))
    conn.commit()
    conn.close()
    return {"status": "success"}
