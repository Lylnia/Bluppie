import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import './index.css';
import WebApp from '@twa-dev/sdk';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

// --- AYARLAR ---
// Render linkini buraya yapıştır (sonunda / olmasın)
const API_URL = "https://bluppie-backend.onrender.com"; 

const TONAPI_KEY = import.meta.env.VITE_TONAPI_KEY; 

// --- SABİTLER ---
const PIE_TOKEN_CONTRACT = "0:e0207601eb9ea16324c92a1d1b74ed8004d01c2d76b8e7022126b02980913c36"; 
const ADMIN_WALLET_ADDRESS = "UQC0GE6NjIui0CAI_as7EKRP2bsetFyVLqz4pwV7BP3HFsE_"; 
const BLUPPIE_NFT_URL = "https://i.imgur.com/TDukTkX.png"; 
const TON_LOGO_URL = "https://ton.org/icons/custom/ton_logo.svg"; 
const PIE_LOGO_URL = "https://i.imgur.com/GMjw61v.jpeg"; 
const BLUM_LOGO_URL = "https://s2.coinmarketcap.com/static/img/coins/200x200/33154.png"; 
const TWITTER_LOGO_URL = "https://pbs.twimg.com/profile_images/1955359038532653056/OSHY3ewP_400x400.jpg";
const TELEGRAM_LOGO_URL = "https://pbs.twimg.com/profile_images/1183117696730390529/LRDASku7_400x400.jpg";
const DISCORD_LOGO_URL = "https://pbs.twimg.com/profile_images/1795851438956204032/rLl5Y48q_400x400.jpg";

const COMMISSION_PIE = 0.001; 
const COMMISSION_TON = 0.03;  
const TOTAL_PACK_SUPPLY = 1000;
const PACK_PRICE = 0.01; 
const PIE_USD_PRICE = 0.0000013; 
const TON_USD_PRICE = 1.50;      

const LINK_BLUM_SWAP = "https://t.me/blum/app?startapp=memepadjetton_PIE_57LxQ-ref_RTUbazVEYx";
const LINK_GAME = "https://t.me/BluppieBot"; 
const SOCIAL_TWITTER = "https://twitter.com/BluppieNFT";
const SOCIAL_TELEGRAM = "https://t.me/BluppieNFT";
const SOCIAL_DISCORD = "https://discord.gg/";

// --- YARDIMCI FONKSİYONLAR ---

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    try {
        const baseUrl = API_URL.includes("localhost") ? API_URL : API_URL.replace(/\/$/, "");
        const res = await fetch(`${baseUrl}${endpoint}`, options);
        // Hata ayıklama için response'u loglayalım
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Hatası (${res.status}): ${errText}`);
        }
        return await res.json();
    } catch (error) {
        console.error("Backend API Error:", error);
        throw error;
    }
}

const waitForTransaction = async (address, expectedAmount) => {
    const maxRetries = 40; // 2 dakika bekle
    let retries = 0;
    const targetWallet = ADMIN_WALLET_ADDRESS.toLowerCase(); 

    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            retries++;
            try {
                const res = await fetch(`https://tonapi.io/v2/blockchain/accounts/${address}/transactions?limit=10`, {
                    headers: TONAPI_KEY ? { 'Authorization': `Bearer ${TONAPI_KEY}` } : {}
                });
                const data = await res.json();

                if (data && data.transactions) {
                    const foundTx = data.transactions.find(tx => {
                        if (tx.out_msgs.length === 0) return false;
                        const msg = tx.out_msgs[0];
                        const amountMatch = Math.abs(msg.value - (expectedAmount * 1000000000)) < 20000000; 
                        const txTime = tx.utime;
                        const now = Math.floor(Date.now() / 1000);
                        const isRecent = (now - txTime) < 300; // 5 dakika tolerans
                        let txDestination = "";
                        if (msg.destination) {
                            txDestination = typeof msg.destination === 'object' ? msg.destination.address : msg.destination;
                        }
                        const destMatch = txDestination && targetWallet.endsWith(txDestination.slice(-30).toLowerCase());
                        return isRecent && amountMatch && destMatch;
                    });
                    if (foundTx) {
                        clearInterval(interval);
                        resolve(true); 
                    }
                }
            } catch (e) { console.error("API Check Error", e); }
            if (retries >= maxRetries) {
                clearInterval(interval);
                resolve(false); 
            }
        }, 3000); 
    });
};

const getHolderBadge = (balance) => {
    if (balance >= 100000) return { title: "WHALE KING", color: "#FFD700", icon: "👑", glow: "0 0 15px rgba(255, 215, 0, 0.6)" }; 
    if (balance >= 50000) return { title: "DIAMOND HAND", color: "#00CED1", icon: "💎", glow: "0 0 10px rgba(0, 206, 209, 0.5)" }; 
    if (balance >= 10000) return { title: "SHARK", color: "#FF5C8D", icon: "🦈", glow: "none" }; 
    return { title: "PLANKTON", color: "#A4B0BE", icon: "🦐", glow: "none" }; 
};

// --- BİLEŞENLER ---

function Toast({ show, message, type }) {
    return (
        <div className={`toast ${show ? 'show' : ''} ${type}`} style={{
            position: 'fixed', top: '20px', left: '50%', transform: show ? 'translate(-50%, 0)' : 'translate(-50%, -150%)',
            padding: '12px 20px', borderRadius: '12px', zIndex: 2100, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            opacity: show ? 1 : 0, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '300px', justifyContent: 'center'
        }}>
            {type === 'success' ? <Icons.Check /> : <span style={{fontSize:20}}>!</span>}
            {message}
        </div>
    );
}

// ... (Diğer Sayfalar - Leaderboard, DAO, Inventory vb. aynı kalıyor, yer kaplamaması için özet geçiyorum, aşağıda Main App var) ...
function LeaderboardPage({ handleBack }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { apiCall('/leaderboard').then(data => { setLeaders(data); setLoading(false); }).catch(err => { console.error(err); setLoading(false); }); }, []);
    return ( <div className="container" style={{ padding: '0' }}><div className="holo-panel" style={{padding:15, display:'flex', alignItems:'center'}}><button onClick={handleBack} style={{background:'none', border:'none', color:'var(--neon-purple)'}}><Icons.Back/></button><h2 style={{flex:1, textAlign:'center'}}>Leaderboard</h2></div><div style={{padding:16}}>{loading && <div>Loading...</div>}{leaders.map((u,i)=>(<div key={i} className="holo-panel" style={{padding:10, marginBottom:5}}>{i+1}. {u.name} - {u.score}</div>))}</div></div> );
}
function DaoPage({ handleBack }) { return <div className="container" style={{padding:0}}><div className="holo-panel" style={{padding:15}}><button onClick={handleBack} style={{background:'none', border:'none', color:'var(--neon-purple)'}}><Icons.Back/></button> DAO (Coming Soon)</div></div>; }
function InventoryPage({ handleBack, openDetails, inventory }) { return <div className="container" style={{padding:0}}><div className="holo-panel" style={{padding:15}}><button onClick={handleBack} style={{background:'none', border:'none', color:'var(--neon-purple)'}}><Icons.Back/></button> Inventory</div><div style={{padding:16}}>{inventory.map(i=><div key={i.id} onClick={()=>openDetails(i)} className="holo-panel" style={{padding:10, marginBottom:5}}>{i.name} #{i.item_number}</div>)}</div></div>; }
function ListingPage({ handleBack }) { return <div className="container"><button onClick={handleBack}>Back</button> Listing Page</div>; }
function StakingPage({ handleBack }) { return <div className="container"><button onClick={handleBack}>Back</button> Staking Page</div>; }
function TransactionHistoryPage({ handleBack }) { return <div className="container"><button onClick={handleBack}>Back</button> History Page</div>; }
function InventoryDetailModal({ show, onClose, nft }) { if(!show) return null; return <div className="modal-overlay" onClick={onClose}><div className="modal-content">Detail: {nft?.name}</div></div>; }
function BalanceTooltipModal({ show, onClose }) { if(!show) return null; return <div className="modal-overlay" onClick={onClose}><div className="modal-content">Balance Details</div></div>; }
function BuyModal({ show, onClose }) { if(!show) return null; return <div className="modal-overlay" onClick={onClose}><div className="modal-content">Buy Modal</div></div>; }

// --- NewPackModal (ÖNEMLİ KISIM) ---
function NewPackModal({ show, onClose, showToast, handlePackPurchase, packsSold, userBalance }) {
    if (!show) return null;
    const TOTAL_SUPPLY = 1000;
    const progressPercent = (packsSold / TOTAL_SUPPLY) * 100; 
    const isSoldOut = packsSold >= TOTAL_SUPPLY;
    const canAfford = userBalance >= PACK_PRICE;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', borderRadius: '24px', padding: '24px', border: '1px solid var(--neon-purple)', boxShadow: '0 0 30px rgba(0,243,255,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor:'pointer' }}><Icons.Close /></button>
                
                <div style={{ textAlign: 'center' }}>
                    <h2 className="text-neon" style={{fontSize: '24px', marginBottom: '5px'}}>Plush Bluppie</h2>
                    <div className="text-dim" style={{fontSize: '12px', letterSpacing: '2px', marginBottom: '20px'}}>LIMITED NFT</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                    <img src={BLUPPIE_NFT_URL} style={{ width: '160px', height: '160px', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 10px rgba(0,243,255,0.5))' }} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        <span>MINT PROGRESS</span>
                        <span className="text-neon">{progressPercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden', border: '1px solid #ccc' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--neon-purple)', boxShadow: '0 0 10px var(--neon-purple)' }} />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px', color: 'var(--color-text-primary)' }}>
                        {packsSold} / {TOTAL_PACK_SUPPLY} MINTED
                    </div>
                </div>

                <div className="holo-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{fontFamily: 'var(--font-head)', fontSize: '18px', color: 'var(--color-text-primary)'}}>COST:</span>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--neon-purple)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-head)' }}>
                            <img src={TON_LOGO_URL} style={{ width: '24px', marginRight: '8px' }} />
                            {PACK_PRICE.toFixed(2)}
                    </div>
                </div>
                
                <button 
                    className="cta-btn" 
                    onClick={() => { if(!isSoldOut && canAfford) handlePackPurchase(); }} 
                    disabled={!canAfford || isSoldOut}
                    style={{ background: isSoldOut ? '#555' : 'var(--neon-purple)' }}
                >
                    {isSoldOut ? 'SOLD OUT' : canAfford ? 'MINT' : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
        </div>
    );
}

// --- MAIN APP ---

function App() {
    const userFriendlyAddress = useTonAddress(); 
    const [tonConnectUI] = useTonConnectUI();
    const [telegramUser, setTelegramUser] = useState(null);

    // Data State
    const [userPieBalance, setUserPieBalance] = useState(0); 
    const [userTonBalance, setUserTonBalance] = useState(0);
    const [userInventory, setUserInventory] = useState([]);
    const [packsSold, setPacksSold] = useState(0);
    
    // UI State
    const [activeTab, setActiveTab] = useState('Menu'); 
    const [showNewPackModal, setShowNewPackModal] = useState(false);
    
    // Debug State
    const [debugMsg, setDebugMsg] = useState("");
    
    // ... Diğer stateler (InventoryPage, ListingPage vb. için) ...
    // KOD KALABALIKLIĞI OLMASIN DİYE ONLARI VARSAYIYORUZ (Yukarıdaki fonksiyonlarda tanımlı)
    // Gerçekte buraya showInventoryPage, setShowInventoryPage vb. eklemelisin.
    // Şimdilik sadece ana akışa odaklanıyoruz.
    const [showInventoryPage, setShowInventoryPage] = useState(false);
    const [showLeaderboardPage, setShowLeaderboardPage] = useState(false);
    const [showDaoPage, setShowDaoPage] = useState(false);
    const [showStakingPage, setShowStakingPage] = useState(false);
    const [showTransactionHistoryPage, setShowTransactionHistoryPage] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- EFFECT: INITIALIZE ---
    useEffect(() => {
        if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            setTelegramUser(WebApp.initDataUnsafe.user);
            WebApp.expand(); 
        }
        // Sayfa açılınca Stats Çek
        apiCall('/stats')
            .then(data => { 
                if(data && data.total_minted !== undefined) setPacksSold(data.total_minted); 
            })
            .catch(err => setDebugMsg("Stats Error: " + err.message));
    }, []);

    // --- EFFECT: DATA FETCH ---
    const fetchAllData = async () => {
        if (!userFriendlyAddress) return;
        
        // 1. TON Balance (Mock or Real)
        try {
            const tonRes = await fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}`, { headers: TONAPI_KEY ? { 'Authorization': `Bearer ${TONAPI_KEY}` } : {} });
            if (tonRes.ok) {
                const tonData = await tonRes.json();
                setUserTonBalance(parseInt(tonData.balance) / 1000000000);
            }
        } catch(e) { console.error(e); }

        // 2. Backend Data
        try {
            const apiData = await apiCall(`/user/${userFriendlyAddress}`);
            setUserInventory(apiData.inventory || []);
        } catch (e) {
            setDebugMsg("Fetch Error: " + e.message);
        }
    };

    useEffect(() => { fetchAllData(); }, [userFriendlyAddress]);

    // --- ACTIONS ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handlePackPurchase = async () => {
        if (!userFriendlyAddress) { alert("Connect Wallet!"); return; }
        setDebugMsg("Starting purchase...");

        const amountTON = PACK_PRICE; 
        const amountNano = Math.floor(amountTON * 1000000000).toString(); 

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, 
            messages: [{ address: ADMIN_WALLET_ADDRESS, amount: amountNano }]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            setDebugMsg("Transaction sent. Waiting for blockchain...");
            showToast("Verifying payment...", "success");
            
            const isConfirmed = await waitForTransaction(userFriendlyAddress, amountTON);

            if (isConfirmed) {
                setDebugMsg("Payment Confirmed! Calling Mint...");
                showToast(`Minting NFT...`, 'success');
                
                try {
                    const mintRes = await apiCall('/mint', 'POST', {
                        owner_address: userFriendlyAddress,
                        name: "Plush Bluppie",
                        item_number: 0, 
                        image_url: BLUPPIE_NFT_URL
                    });

                    if (mintRes && mintRes.status === 'success') {
                         setDebugMsg("MINT SUCCESS! ID: " + mintRes.minted_id);
                         alert(`SUCCESS! You got Plush Bluppie #${mintRes.minted_id}`);
                         setPacksSold(prev => prev + 1);
                         fetchAllData();
                         setShowNewPackModal(false);
                    } else {
                        setDebugMsg("Mint Failed: API returned error");
                        alert("Error: Backend did not mint.");
                    }
                } catch (mintError) {
                    setDebugMsg("Mint API Error: " + mintError.message);
                    alert("Mint API Error: " + mintError.message);
                }
            } else {
                setDebugMsg("Payment Timeout. Check wallet.");
                alert("Payment Verification Timeout.");
            }
        } catch (e) {
            setDebugMsg("Tx Cancelled/Error: " + e.message);
            showToast('Transaction cancelled.', 'error');
        }
    };

    // --- DEBUG: TEST MINT (No Pay) ---
    const debugMint = async () => {
        if(!userFriendlyAddress) { alert("Connect wallet first"); return; }
        setDebugMsg("Forcing Mint (Debug)...");
        try {
            const res = await apiCall('/mint', 'POST', {
                owner_address: userFriendlyAddress,
                name: "Plush Bluppie",
                item_number: 0, 
                image_url: BLUPPIE_NFT_URL
            });
            setDebugMsg("Debug Mint Result: " + JSON.stringify(res));
            if(res.status === 'success') {
                fetchAllData();
                setPacksSold(prev => prev + 1);
                alert("Debug Mint Başarılı! Envantere bak.");
            }
        } catch(e) {
            setDebugMsg("Debug Mint Error: " + e.message);
            alert("Debug Mint Hatası: " + e.message);
        }
    };

    const renderContent = () => {
        // ... (Sayfa yönlendirmeleri, kod kalabalığı olmasın diye basitleştirildi) ...
        if (showInventoryPage) return <InventoryPage handleBack={()=>setShowInventoryPage(false)} inventory={userInventory} />;
        if (showLeaderboardPage) return <LeaderboardPage handleBack={()=>setShowLeaderboardPage(false)} />;
        // ... diğer if'ler ...

        if (activeTab === 'Menu') {
            return (
                <>
                    <div className="holo-panel pulse-glow">
                        <div className="balance-display">
                            <div className="balance-usd">${(userPieBalance * PIE_USD_PRICE).toFixed(2)}</div>
                            <div className="balance-pie">{userPieBalance.toFixed(2)} $PIE</div>
                        </div>
                        <div className="action-buttons">
                            <button className="action-btn">STAKE</button>
                            <button className="action-btn">SOCIAL</button>
                        </div>
                    </div>
                    
                    <div className="holo-panel">
                        <div className="nft-title">New Packages & Pre-Sale</div> 
                        <div className="nft-scroll">
                            <div className="nft-card" onClick={() => setShowNewPackModal(true)} style={{ minWidth: '280px' }}>
                                <div style={{ padding: '15px', textAlign: 'center' }}>
                                    <div>Plush Bluppie</div>
                                    <img className="nft-image" src={BLUPPIE_NFT_URL} />
                                    <div className="text-neon">{PACK_PRICE.toFixed(2)} TON</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        if (activeTab === 'Profile') {
            return (
                <div className="holo-panel">
                    <h3>Profile</h3>
                    <TonConnectButton />
                    <div>{userFriendlyAddress ? userFriendlyAddress.slice(0,6) : 'No Wallet'}</div>
                    <button onClick={()=>setShowInventoryPage(true)} style={{marginTop:10, display:'block'}}>Inventory</button>
                    <button onClick={()=>setShowLeaderboardPage(true)} style={{marginTop:10, display:'block'}}>Leaderboard</button>
                </div>
            );
        }
        return <div>Marketplace (Coming Soon)</div>;
    };

    return (
        <div className="container" style={{paddingBottom: 150}}>
            {renderContent()}
            
            <Toast show={toast.show} message={toast.message} type={toast.type} />
            <NewPackModal show={showNewPackModal} onClose={()=>setShowNewPackModal(false)} showToast={showToast} handlePackPurchase={handlePackPurchase} packsSold={packsSold} userBalance={userTonBalance} />
            
            <nav className="bottom-nav" style={{position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 400, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000}}>
                <div className={`nav-item ${activeTab === 'Menu' ? 'active' : ''}`} onClick={() => setActiveTab('Menu')}><Icons.Menu /></div>
                <div className={`nav-item ${activeTab === 'Marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('Marketplace')}><Icons.Market /></div>
                <div className={`nav-item ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => setActiveTab('Profile')}><Icons.Profile /></div>
            </nav>

            {/* --- DEBUG PANEL (SAYFANIN EN ALTINDA) --- */}
            <div style={{background: '#000', color: '#0f0', padding: 20, marginTop: 20, fontSize: 12, fontFamily: 'monospace', border: '1px solid #0f0', borderRadius: 10, wordBreak: 'break-all'}}>
                <h3 style={{margin:0, borderBottom:'1px solid #0f0'}}>🛠 DEBUG PANEL</h3>
                <p>Status: {debugMsg || "Ready"}</p>
                <div style={{display:'flex', gap:10, marginTop:10}}>
                    <button style={{background:'#333', color:'#fff', padding:5}} onClick={async ()=>{ try{const r=await apiCall('/'); setDebugMsg("API OK: "+r.status)}catch(e){setDebugMsg("API FAIL: "+e.message)} }}>TEST API</button>
                    <button style={{background:'#500', color:'#fff', padding:5}} onClick={debugMint}>FORCE MINT (TEST)</button>
                </div>
                <p style={{marginTop:5}}>API: {API_URL}</p>
            </div>
        </div>
    );
}

export default App;
