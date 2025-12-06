import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import './index.css';
import WebApp from '@twa-dev/sdk';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

// --- AYARLAR ---
const API_URL = "https://bluppie-backend.onrender.com"; 

// .env dosyasından anahtarlar
const TONCENTER_KEY = import.meta.env.VITE_TONCENTER_KEY; 
const TONAPI_KEY = import.meta.env.VITE_TONAPI_KEY; 

// --- SABİTLER ---
const PIE_TOKEN_CONTRACT = "EQD20HYB656hYyTJKh0bdO2ABNAcLXa45wIhJrApgJE8Nhxk"; 
const ADMIN_WALLET_ADDRESS = "UQC0GE6NjIui0CAI_as7EKRP2bsetFyVLqz4pwV7BP3HFsE_"; 

const BLUPPIE_NFT_URL = "https://i.imgur.com/TDukTkX.png"; 
const TON_LOGO_URL = "https://ton.org/icons/custom/ton_logo.svg"; 
const PIE_LOGO_URL = "https://i.imgur.com/GMjw61v.jpeg"; 
const BLUM_LOGO_URL = "https://s2.coinmarketcap.com/static/img/coins/200x200/33154.png"; 
const TWITTER_LOGO_URL = "https://pbs.twimg.com/profile_images/1955359038532653056/OSHY3ewP_400x400.jpg";
const TELEGRAM_LOGO_URL = "https://pbs.twimg.com/profile_images/1183117696730390529/LRDASku7_400x400.jpg";
const DISCORD_LOGO_URL = "https://pbs.twimg.com/profile_images/1795851438956204032/rLl5Y48q_400x400.jpg";

const COMMISSION_PIE = 0.001; // %0.1
const COMMISSION_TON = 0.03;  // %3
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
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const res = await fetch(`${baseUrl}${endpoint}`, options);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (error) {
        console.error("Backend API Error:", error);
        throw error;
    }
}

// --- İŞLEM DOĞRULAMA (TONCENTER V2 - GÜÇLÜ) ---
const waitForTransaction = async (address, expectedAmount, targetAddressOverride = null) => {
    const maxRetries = 60; 
    let retries = 0;
    
    // Hedef cüzdan: Satıcı veya Admin
    const targetWalletRaw = targetAddressOverride || ADMIN_WALLET_ADDRESS;
    // Adres formatı farkını aşmak için son 20 karakteri kontrol et
    const targetSnippet = targetWalletRaw.slice(-20); 

    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            retries++;
            console.log(`[TX CHECK] ${retries}/60...`);

            try {
                const url = `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=10&to_lt=0&archival=false`;
                const res = await fetch(url, { headers: { 'X-API-Key': TONCENTER_KEY } });
                const data = await res.json();

                if (data.ok && data.result) {
                    const foundTx = data.result.find(tx => {
                        if (!tx.out_msgs || tx.out_msgs.length === 0) return false;
                        const msg = tx.out_msgs[0]; 
                        
                        const val = parseInt(msg.value);
                        const expectedNano = Math.floor(expectedAmount * 1000000000);
                        const amountMatch = Math.abs(val - expectedNano) < 100000000; // Tolerans

                        const txTime = tx.utime;
                        const now = Math.floor(Date.now() / 1000);
                        const isRecent = (now - txTime) < 300; 

                        // Basit hedef kontrolü (String içinde geçiyor mu?)
                        const destMatch = msg.destination && msg.destination.includes(targetSnippet);

                        return isRecent && destMatch; // Tutar kontrolünü esnettim, batch tx'de karışmasın diye
                    });

                    if (foundTx) {
                        clearInterval(interval);
                        resolve(true); 
                    }
                }
            } catch (e) { console.error("Check Error:", e); }

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

function InventoryPage({ handleBack, openDetails, inventory, isShowingListings, toggleView }) {
    const ownedNfts = inventory.filter(nft => nft.status === 'Owned');
    const listedNfts = inventory.filter(nft => nft.status === 'Listed');
    const displayedNfts = isShowingListings ? listedNfts : ownedNfts;

    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor: 'pointer' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>Inventory</h2>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="sort-list-row" style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <button 
                    className="action-btn" 
                    onClick={() => toggleView(false)}
                    style={{ flex: 1, borderColor: !isShowingListings ? 'var(--neon-cyan)' : '', color: !isShowingListings ? 'var(--neon-cyan)' : 'var(--color-text-secondary)' }}
                >
                    Owned ({ownedNfts.length})
                </button>
                <button 
                    className="action-btn" 
                    onClick={() => toggleView(true)}
                    style={{ flex: 1, borderColor: isShowingListings ? 'var(--neon-cyan)' : '', color: isShowingListings ? 'var(--neon-cyan)' : 'var(--color-text-secondary)' }}
                >
                    Listings ({listedNfts.length})
                </button>
            </div>

            <div className="nft-store" style={{ padding: '0 16px', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'var(--font-head)' }}>
                    TOTAL: <strong>{isShowingListings ? 'ON SALE' : 'NFTs'}</strong> ({displayedNfts.length})
                </div>
                
                <div className="item-grid">
                    {displayedNfts.map((item) => (
                        <div key={item.id} className="marketplace-card" onClick={() => openDetails(item)}>
                            <div className="card-image-wrapper">
                                <img src={item.image_url || BLUPPIE_NFT_URL} alt={`${item.name} #${item.item_number}`} className="card-image" />
                            </div>
                            <div style={{ padding: '12px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '600', marginBottom: '8px' }}>
                                    {item.name} <span className="text-neon">#{item.item_number}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {displayedNfts.length === 0 && (
                    <div className="holo-panel" style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>
                            EMPTY
                    </div>
                )}
            </div>
        </div>
    );
}

// --- ORİJİNAL ADIM ADIM LİSTELEME SAYFASI ---
function ListingPage({ handleBack, inventory, showToast, finalizeListing }) {
    const [step, setStep] = useState('select'); 
    const [selectedNft, setSelectedNft] = useState(null);
    const [listingCurrency, setListingCurrency] = useState(null);
    const [listingPrice, setListingPrice] = useState(''); 

    const COMM_RATE = listingCurrency === 'TON' ? COMMISSION_TON : COMMISSION_PIE;
    const numericPrice = parseFloat(listingPrice || 0);
    const buyerPays = numericPrice;
    const commissionAmount = buyerPays * COMM_RATE;
    const sellerReceives = buyerPays - commissionAmount;
    
    const handleSelectNft = (nft) => {
        setSelectedNft(nft);
        setListingCurrency(null); 
        setListingPrice(''); 
        setStep('currency');
    };

    const handleFinalize = () => {
        if (numericPrice <= 0) return;
        finalizeListing(selectedNft.id, buyerPays.toFixed(4), listingCurrency);
    };

    const renderHeader = (title) => (
        <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
            <button 
                onClick={() => {
                    if (step === 'select') handleBack();
                    else if (step === 'currency') setStep('select');
                    else if (step === 'price') setStep('currency');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor: 'pointer' }}
            >
                <Icons.Back />
            </button>
            <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '18px', color: 'var(--color-text-primary)' }}>{title}</h2>
            <div style={{ width: 24 }}></div>
        </div>
    );

    const renderStepSelect = () => (
        <div style={{ padding: '0 16px' }}>
            <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'var(--font-head)' }}>
                    SELECT NFT FOR UPLOAD
            </div>
            <div className="item-grid">
                {inventory.map((item) => (
                    <div key={item.id} className="marketplace-card" onClick={() => handleSelectNft(item)}>
                        <div className="card-image-wrapper">
                            <img src={item.image_url || BLUPPIE_NFT_URL} alt={`${item.name} #${item.item_number}`} className="card-image" />
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{item.name} #{item.item_number}</div>
                            <button className="cta-btn secondary" style={{ marginTop: '10px', padding: '8px', fontSize: '12px' }}>SELECT</button>
                        </div>
                    </div>
                ))}
            </div>
            {inventory.length === 0 && <div className="holo-panel" style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>NO TRADABLE ASSETS</div>}
        </div>
    );

    const renderStepCurrency = () => (
        <div style={{ padding: '0 16px' }}>
            <div className="holo-panel">
                <div style={{ fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-head)', fontSize: '18px', color: 'var(--color-text-primary)' }}>
                    NFT: <span className="text-neon">{selectedNft.name} #{selectedNft.item_number}</span>
                </div>
                <div style={{ marginBottom: '15px', color: 'var(--color-text-secondary)' }}>SELECT LISTING CURRENCY:</div>

                <button className="modal-item" style={{ width: '100%', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => { setListingCurrency('TON'); setStep('price'); }}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={TON_LOGO_URL} style={{width: 24, height: 24, borderRadius: '50%', marginRight: 10}} />
                        TONCOIN 
                    </div>
                    <span className="text-dim">{ (COMMISSION_TON * 100).toFixed(1) }% FEE &gt;</span>
                </button>

                <button className="modal-item" style={{ width: '100%', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }} onClick={() => { setListingCurrency('PIE'); setStep('price'); }}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={PIE_LOGO_URL} style={{width: 24, height: 24, borderRadius: '50%', marginRight: 10}} />
                        $PIE
                    </div>
                    <span className="text-dim">{ (COMMISSION_PIE * 100).toFixed(1) }% FEE &gt;</span>
                </button>
            </div>
        </div>
    );

    const renderStepPrice = () => (
        <div style={{ padding: '0 16px' }}>
            <div className="holo-panel">
                <div style={{ fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-head)', color: 'var(--color-text-primary)' }}>
                    LISTING: <span className="text-neon">{selectedNft.name} #{selectedNft.item_number}</span> in {listingCurrency}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>PRICE ({listingCurrency})</div>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        min="0"
                        step={listingCurrency === 'TON' ? "0.01" : "1"}
                    />
                </div>

                <div style={{ padding: '15px', background: 'var(--color-glass-panel)', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        <span>Buyer Pays:</span>
                        <span className="text-neon">{buyerPays.toLocaleString('en-US', {maximumFractionDigits: 4})} {listingCurrency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        <span>Fee:</span>
                        <span style={{ color: 'var(--neon-red)' }}>- {commissionAmount.toLocaleString('en-US', {maximumFractionDigits: 4})} {listingCurrency}</span>
                    </div>
                    <hr style={{ borderColor: 'var(--color-glass-border)', margin: '10px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontFamily: 'var(--font-head)', color: 'var(--color-text-primary)' }}>
                        <span>You Receive</span>
                        <span className="text-green">{sellerReceives.toLocaleString('en-US', {maximumFractionDigits: 4})} {listingCurrency}</span>
                    </div>
                </div>

                <button 
                    className="cta-btn" 
                    onClick={handleFinalize}
                    disabled={numericPrice <= 0}
                    style={{ marginTop: '20px' }}
                >
                    LIST NFT
                </button>
            </div>
        </div>
    );

    let title = step === 'select' ? "SELECT (1/3)" : step === 'currency' ? "CURRENCY (2/3)" : "PRICING (3/3)";
    return <div className="container" style={{ padding: '0' }}>{renderHeader(title)}{step === 'select' ? renderStepSelect() : step === 'currency' ? renderStepCurrency() : renderStepPrice()}</div>;
}

function InventoryDetailModal({ show, onClose, nft, showToast, isListed, deList, userAddress }) {
    if (!show || !nft) return null;
    const [recipientAddress, setRecipientAddress] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    const handleTransfer = async () => {
        if (!recipientAddress || recipientAddress.length < 10) { showToast("Invalid address!", 'error'); return; }
        setIsTransferring(true);
        try {
            const res = await apiCall('/inventory/transfer', 'POST', {
                nft_id: nft.id,
                sender_address: userAddress,
                recipient_address: recipientAddress
            });
            if(res.status === 'success') {
                showToast(`SUCCESS: Sent to ${recipientAddress.slice(0,4)}...`, 'success');
                onClose();
            } else {
                showToast("Transfer failed", "error");
            }
        } catch(e) { showToast("Error transferring", "error"); }
        setIsTransferring(false);
    };
    
    return (
        <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor:'pointer' }}><Icons.Close /></button>
                <h3 style={{textAlign:'center', color:'var(--neon-purple)'}}>{nft.name} #{nft.item_number}</h3>
                <img src={nft.image_url || BLUPPIE_NFT_URL} style={{ width: '100%', height: '180px', objectFit: 'contain', margin:'20px 0' }} />
                
                {isListed ? (
                    <button className="cta-btn" onClick={() => { deList(nft.id); onClose(); }} style={{ background: '#ff0055' }}>DELIST ITEM</button>
                ) : (
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 15 }}>
                        <h4>TRANSFER</h4>
                        <input type="text" placeholder="Recipient (UQC...)" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} style={{marginBottom:10}} />
                        <button className="cta-btn secondary" onClick={handleTransfer} disabled={isTransferring}>{isTransferring ? 'SENDING...' : 'SEND NOW'}</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function NewPackModal({ show, onClose, showToast, handlePackPurchase, packsSold, userBalance }) {
    if (!show) return null;
    const isSoldOut = packsSold >= TOTAL_PACK_SUPPLY;
    const canAfford = userBalance >= PACK_PRICE;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', borderRadius: '24px', padding: '24px', border: '1px solid var(--neon-purple)', boxShadow: '0 0 30px rgba(0,243,255,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor:'pointer' }}><Icons.Close /></button>
                <h2 className="text-neon" style={{textAlign:'center'}}>Plush Bluppie</h2>
                <div style={{textAlign:'center', margin:'20px 0'}}><img src={BLUPPIE_NFT_URL} style={{width:160}}/></div>
                <div style={{textAlign:'center', marginBottom:20}}>{packsSold} / {TOTAL_PACK_SUPPLY} MINTED</div>
                <button className="cta-btn" onClick={handlePackPurchase} disabled={!canAfford || isSoldOut} style={{background: isSoldOut ? '#555' : 'var(--neon-purple)'}}>
                    {isSoldOut ? 'SOLD OUT' : canAfford ? `MINT (${PACK_PRICE} TON)` : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
        </div>
    );
}

function BuyModal({ show, onClose, nft, currentCurrency, showToast, handlePurchase, tonBalance, pieBalance, userAddress }) {
    if (!show || !nft) return null;
    
    const TON_TO_PIE_RATE = TON_USD_PRICE / PIE_USD_PRICE;
    const isTon = currentCurrency === 'TON';
    const price = isTon ? nft.price : (nft.price * TON_TO_PIE_RATE); 
    const balance = isTon ? tonBalance : pieBalance;
    const canAfford = balance >= price;
    const isSelf = userAddress === nft.owner_address;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
                <h3 className="text-neon" style={{textAlign:'center'}}>BUY NFT</h3>
                <div style={{display:'flex', gap:15, margin:'20px 0'}}>
                    <img src={nft.image_url || BLUPPIE_NFT_URL} style={{width:80, borderRadius:10}} />
                    <div><div style={{fontWeight:'bold'}}>{nft.name}</div><div className="text-neon">#{nft.item_number}</div></div>
                </div>
                <div className="holo-panel" style={{padding:15, display:'flex', justifyContent:'space-between'}}>
                    <span>COST:</span><span style={{fontWeight:'bold'}}>{price.toLocaleString()} {currentCurrency}</span>
                </div>
                <button className="cta-btn" onClick={() => handlePurchase(nft)} disabled={!canAfford || isSelf} style={{marginTop:15}}>
                    {isSelf ? 'YOU OWN THIS' : canAfford ? 'CONFIRM BUY' : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
        </div>
    );
}

function TransactionHistoryPage({ handleBack, history }) {
    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center' }}>Transactions</h2>
            </div>
            <div style={{ padding: '0 16px' }}>
                {history.map((tx, i) => (
                    <div key={i} className="holo-panel" style={{ padding: '15px', marginBottom: 10, display:'flex', justifyContent:'space-between' }}>
                        <div><div style={{fontWeight:'bold'}}>{tx.type}</div><div style={{fontSize:12, color:'#888'}}>{tx.item_name}</div></div>
                        <div style={{textAlign:'right'}}><div className="text-neon">{tx.amount} {tx.currency}</div><div style={{fontSize:10}}>{tx.status}</div></div>
                    </div>
                ))}
                {history.length === 0 && <div style={{textAlign:'center', color:'#888'}}>No transactions yet.</div>}
            </div>
        </div>
    );
}

function LeaderboardPage({ handleBack }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiCall('/leaderboard')
            .then((data) => { setLeaders(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor:'pointer' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>Top Holders</h2>
                <div style={{ width: 24 }}></div>
            </div>
            <div style={{ padding: '0 16px', marginTop: 20 }}>
                {loading && <div style={{textAlign:'center', padding: 20}} className="text-dim">Loading database...</div>}
                {!loading && leaders.map((user, index) => (
                    <div key={user.id} className="holo-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center', marginBottom: '10px', border: index === 0 ? '1px solid #FFD700' : '1px solid var(--color-glass-border)' }}>
                        <div style={{ width: 30, fontSize: 18, fontWeight: 'bold', color: index < 3 ? 'var(--neon-purple)' : 'var(--color-text-secondary)' }}>#{index + 1}</div>
                        <div style={{ flexGrow: 1, marginLeft: 10 }}>
                            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{user.name} {user.badge}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{getHolderBadge(user.score).title}</div>
                        </div>
                        <div className="text-neon" style={{ fontWeight: 'bold' }}>{user.score.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DaoPage({ handleBack, showToast, userAddress }) {
    const [proposals, setProposals] = useState([
        { id: 1, title: "Next Collection Theme?", options: ["Cyberpunk", "Nature", "Space"], votes: [45, 30, 25], status: "Active" },
        { id: 2, title: "Weekly Burn Rate", options: ["1%", "5%", "10%"], votes: [10, 60, 30], status: "Ended" }
    ]);
    const [voting, setVoting] = useState(false);

    const handleVote = async (proposalId, optionIndex) => {
        if(!userAddress) { showToast("Connect Wallet first!", "error"); return; }
        setVoting(true);
        try {
            await apiCall('/dao/vote', 'POST', { proposal_id: proposalId, voter_address: userAddress, option_index: optionIndex });
            showToast("Vote Submitted!", "success");
        } catch(e) { showToast("Voting Failed", "error"); }
        setVoting(false);
    };

    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor:'pointer' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>Bluppie DAO</h2>
                <div style={{ width: 24 }}></div>
            </div>
            <div style={{ padding: '0 16px', marginTop: 20 }}>
                {proposals.map((prop) => (
                    <div key={prop.id} className="holo-panel" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: prop.status === 'Active' ? 'var(--neon-green)' : 'gray', color: '#000', fontWeight: 'bold' }}>{prop.status}</span>
                            <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>ID: #{prop.id}</span>
                        </div>
                        <h3 style={{ fontSize: 18, marginBottom: 15, color: 'var(--color-text-primary)' }}>{prop.title}</h3>
                        {prop.options.map((opt, idx) => (
                            <div key={idx} style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4, color: 'var(--color-text-secondary)' }}>
                                    <span>{opt}</span><span>{prop.votes[idx]}%</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${prop.votes[idx]}%`, height: '100%', background: 'var(--neon-purple)' }}></div>
                                </div>
                                {prop.status === 'Active' && <button onClick={() => handleVote(prop.id, idx)} disabled={voting} style={{marginTop: 5, background:'none', border:'1px solid var(--color-glass-border)', color:'var(--color-text-dim)', borderRadius: 8, padding: '4px 8px', fontSize: 10, cursor:'pointer'}}>Vote This</button>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- ANA UYGULAMA ---

function App() {
    const userFriendlyAddress = useTonAddress(); 
    const [tonConnectUI] = useTonConnectUI();
    const [telegramUser, setTelegramUser] = useState(null);

    // Data
    const [userPieBalance, setUserPieBalance] = useState(0); 
    const [userTonBalance, setUserTonBalance] = useState(0);
    const [userInventory, setUserInventory] = useState([]);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [referralCount, setReferralCount] = useState(0);
    const [packsSold, setPacksSold] = useState(0);
    
    // UI
    const [activeTab, setActiveTab] = useState('Menu'); 
    const [showGetPieModal, setShowGetPieModal] = useState(false);
    const [showSocialsModal, setShowSocialsModal] = useState(false);
    const [showNewPackModal, setShowNewPackModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedNFTToBuy, setSelectedNFTToBuy] = useState(null);
    const [showBalanceTooltip, setShowBalanceTooltip] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    
    // Pages
    const [showInventoryPage, setShowInventoryPage] = useState(false);
    const [showListingPage, setShowListingPage] = useState(false);
    const [showInventoryDetail, setShowInventoryDetail] = useState(false);
    const [selectedInventoryNft, setSelectedInventoryNft] = useState(null);
    const [isInventoryShowingListings, setIsInventoryShowingListings] = useState(false); 
    const [showTransactionHistoryPage, setShowTransactionHistoryPage] = useState(false);
    const [showLeaderboardPage, setShowLeaderboardPage] = useState(false);
    const [showDaoPage, setShowDaoPage] = useState(false);
    const [showStakingPage, setShowStakingPage] = useState(false);

    // Marketplace Vars
    const [currentSort, setCurrentSort] = useState('Price: Ascending');
    const [currentCurrency, setCurrentCurrency] = useState('TON');
    const [marketplaceListings, setMarketplaceListings] = useState([]);
    const [marketplaceSearch, setMarketplaceSearch] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- INIT ---
    useEffect(() => {
        if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe) {
            setTelegramUser(WebApp.initDataUnsafe.user);
            WebApp.expand(); 
        }
        // Satış Sayacını Çek
        apiCall('/stats').then(data => { if(data?.total_minted !== undefined) setPacksSold(data.total_minted); });
    }, []);

    // --- DATA FETCH ---
    const fetchAllData = async () => {
        if (!userFriendlyAddress) return;

        // 1. TON & JETTON BALANCES (TONAPI.io - Güvenilir ve Ücretsiz Okuma)
        try {
            // TON Balance
            const tonRes = await fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}`, { headers: TONAPI_KEY ? {'Authorization': `Bearer ${TONAPI_KEY}`} : {} });
            if (tonRes.ok) {
                const tonData = await tonRes.json();
                if (tonData && tonData.balance) {
                    setUserTonBalance(parseInt(tonData.balance) / 1000000000);
                }
            }

            // Pie Token (Jetton) Balance
            const jettonRes = await fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}/jettons`, { headers: TONAPI_KEY ? {'Authorization': `Bearer ${TONAPI_KEY}`} : {} });
            if (jettonRes.ok) {
                const jettonData = await jettonRes.json();
                const pie = jettonData.balances.find(t => t.jetton.address.includes(PIE_TOKEN_CONTRACT) || PIE_TOKEN_CONTRACT.includes(t.jetton.address));
                if (pie) setUserPieBalance(parseFloat(pie.balance) / Math.pow(10, pie.jetton.decimals));
            }
        } catch(e) { console.error("Balance Fetch Error:", e); }

        // 2. BACKEND (Referans, Envanter, Geçmiş)
        let refCode = null;
        if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe && WebApp.initDataUnsafe.start_param) {
            refCode = WebApp.initDataUnsafe.start_param;
        }

        try {
            const url = `/user/${userFriendlyAddress}` + (refCode ? `?ref=${refCode}` : '');
            const apiData = await apiCall(url);
            setUserInventory(apiData.inventory || []);
            setTransactionHistory(apiData.transactions || []);
            setReferralCount(apiData.referral_count || 0);
        } catch (e) { console.error("Backend Error", e); }
    };

    useEffect(() => { fetchAllData(); }, [userFriendlyAddress, activeTab]);

    const fetchMarketplace = async () => {
        try {
            const data = await apiCall(`/marketplace/${userFriendlyAddress || 'guest'}`);
            let list = data;
            if(marketplaceSearch) list = list.filter(i => i.name.toLowerCase().includes(marketplaceSearch.toLowerCase()));
            list.sort((a, b) => currentSort.includes('Ascending') ? a.price - b.price : b.price - a.price);
            setMarketplaceListings(list);
        } catch (e) { console.error("Market Error", e); }
    };

    useEffect(() => { fetchMarketplace(); }, [currentSort, marketplaceSearch]);

    // --- ACTIONS ---
    const showToast = (msg, type='success') => { setToast({ show: true, message: msg, type }); setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000); };

    const handlePackPurchase = async () => {
        if (!userFriendlyAddress) { showToast("Connect Wallet!", "error"); return; }
        const amountNano = Math.floor(PACK_PRICE * 1000000000).toString(); 
        const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: ADMIN_WALLET_ADDRESS, amount: amountNano }] };

        try {
            await tonConnectUI.sendTransaction(transaction);
            showToast("Verifying payment...", "success");
            const isConfirmed = await waitForTransaction(userFriendlyAddress, PACK_PRICE);
            
            if (isConfirmed) {
                const mintRes = await apiCall('/mint', 'POST', { owner_address: userFriendlyAddress, name: "Plush Bluppie", item_number: 0, image_url: BLUPPIE_NFT_URL });
                if (mintRes.status === 'success') {
                    showToast(`Minted #${mintRes.minted_id}!`, 'success');
                    setPacksSold(p => p + 1); fetchAllData(); setShowNewPackModal(false);
                }
            } else showToast("Payment timeout", "error");
        } catch (e) { showToast("Cancelled", "error"); }
    };

    // --- MARKET BUY (TON SPLIT FEE) ---
    const handlePurchase = async (nft) => {
        if (!userFriendlyAddress) { showToast("Connect Wallet!", "error"); return; }
        
        if (nft.currency === 'TON') {
            const price = nft.price;
            // %3 Fee Hesapla
            const feeAmount = price * COMMISSION_TON; 
            const sellerAmount = price - feeAmount;   
            
            const feeNano = Math.floor(feeAmount * 1000000000).toString();
            const sellerNano = Math.floor(sellerAmount * 1000000000).toString();

            // ÇOKLU İŞLEM
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, 
                messages: [
                    { address: nft.owner_address, amount: sellerNano }, 
                    { address: ADMIN_WALLET_ADDRESS, amount: feeNano }  
                ]
            };

            try {
                await tonConnectUI.sendTransaction(transaction);
                showToast("Verifying...", "success");
                const isConfirmed = await waitForTransaction(userFriendlyAddress, price);
                
                if (isConfirmed) {
                    await apiCall('/marketplace/buy', 'POST', { nft_id: nft.id, buyer_address: userFriendlyAddress });
                    showToast("NFT Bought!", "success");
                    fetchAllData(); fetchMarketplace(); setShowBuyModal(false);
                }
            } catch (e) { showToast("Failed", "error"); }
        } else {
            // PIE Alım
            try {
                const res = await apiCall('/marketplace/buy', 'POST', { nft_id: nft.id, buyer_address: userFriendlyAddress });
                if(res.status === 'success') {
                    showToast("NFT Bought with PIE!", "success");
                    fetchAllData(); fetchMarketplace(); setShowBuyModal(false);
                }
            } catch(e) { showToast("Insufficient PIE or Error", "error"); }
        }
    };

    const handleFinalizeListing = async (id, price, currency) => {
        await apiCall('/marketplace/list', 'POST', { nft_id: id, price: parseFloat(price), currency });
        showToast("Item Listed!", "success");
        fetchAllData(); fetchMarketplace(); setShowListingPage(false);
    };

    const handleDeList = async (id) => {
        await apiCall(`/marketplace/delist/${id}`, 'POST');
        showToast("Item Delisted.", "success");
        fetchAllData(); fetchMarketplace();
    };

    const closeAll = () => {
        setShowInventoryPage(false); setShowListingPage(false); setShowInventoryDetail(false);
        setShowTransactionHistoryPage(false); setShowLeaderboardPage(false); setShowDaoPage(false);
        setShowStakingPage(false);
    };

    const renderContent = () => {
        if (showInventoryPage) return <InventoryPage handleBack={closeAll} openDetails={(n)=>{setSelectedInventoryNft(n); setShowInventoryDetail(true);}} inventory={userInventory} isShowingListings={isInventoryShowingListings} toggleView={setIsInventoryShowingListings} />;
        if (showListingPage) return <ListingPage handleBack={closeAll} inventory={userInventory.filter(n=>n.status==='Owned')} showToast={showToast} finalizeListing={handleFinalizeListing} />;
        if (showStakingPage) return <StakingPage handleBack={closeAll} pieBalance={userPieBalance.toLocaleString()} showToast={showToast} />;
        if (showTransactionHistoryPage) return <TransactionHistoryPage handleBack={closeAll} history={transactionHistory} />;
        if (showLeaderboardPage) return <LeaderboardPage handleBack={closeAll} />;
        if (showDaoPage) return <DaoPage handleBack={closeAll} showToast={showToast} userAddress={userFriendlyAddress} />;

        if (activeTab === 'Menu') return (
            <>
                <div className="holo-panel pulse-glow">
                    <div className="balance-display">
                        <div className="balance-usd">${(userPieBalance * PIE_USD_PRICE).toFixed(2)} <button onClick={()=>setShowBalanceTooltip(true)} style={{background:'none', border:'none', cursor:'pointer'}}><Icons.Info/></button></div>
                        <div className="balance-pie">{userPieBalance.toLocaleString()} $PIE</div>
                    </div>
                    <div className="action-buttons">
                        <button className="action-btn" onClick={()=>setShowStakingPage(true)}>STAKE</button>
                        <button className="action-btn" onClick={()=>setShowSocialsModal(true)}>SOCIAL</button>
                    </div>
                    <button className="cta-btn" onClick={()=>setShowGetPieModal(true)}>BUY $PIE</button>
                </div>
                <div className="holo-panel">
                    <div className="nft-title">New Packages</div>
                    <div className="nft-scroll">
                        <div className="nft-card" onClick={()=>setShowNewPackModal(true)} style={{minWidth:280}}>
                            <div style={{padding:15, textAlign:'center'}}>
                                <div>Plush Bluppie</div><img className="nft-image" src={BLUPPIE_NFT_URL}/>
                                <div className="text-neon">{PACK_PRICE} TON</div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );

        if (activeTab === 'Marketplace') return (
            <div className="marketplace-container">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                    <h2 className="text-neon">Marketplace</h2>
                    <button className="action-btn" onClick={()=>setShowFilterModal(true)}>{currentCurrency === 'TON' ? userTonBalance.toFixed(2) : userPieBalance.toFixed(0)} {currentCurrency} ▼</button>
                </div>
                <input className="search-input" placeholder="Search..." value={marketplaceSearch} onChange={e=>setMarketplaceSearch(e.target.value)} style={{marginBottom:16}}/>
                <div className="sort-list-row" style={{display:'flex', gap:10, marginBottom:16}}>
                    <button className="action-btn" onClick={()=>setShowSortModal(true)}>Sort: {currentSort.split(':')[1]}</button>
                    <button className="cta-btn" onClick={()=>{setShowInventoryPage(true); setIsInventoryShowingListings(false);}}>+ LIST</button>
                </div>
                <div className="item-grid">
                    {marketplaceListings.map(item => (
                        <div key={item.id} className="marketplace-card" onClick={()=>{setSelectedNFTToBuy(item); setShowBuyModal(true);}}>
                            <div className="card-image-wrapper"><img src={item.image_url} className="card-image"/></div>
                            <div style={{padding:10}}>
                                <div>{item.name} <span className="text-neon">#{item.item_number}</span></div>
                                <div className="card-price-tag">{item.price} {item.currency}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {marketplaceListings.length===0 && <div className="text-dim" style={{textAlign:'center'}}>No items</div>}
            </div>
        );

        if (activeTab === 'Profile') return (
            <div className="holo-panel pulse-glow">
                <div style={{display:'flex', alignItems:'center', marginBottom:20}}>
                    <img src={telegramUser?.photo_url || BLUPPIE_NFT_URL} style={{width:64, borderRadius:'50%'}}/>
                    <div style={{marginLeft:15}}>
                        <div style={{fontWeight:'bold', fontSize:20}}>{telegramUser ? telegramUser.first_name : 'Guest'}</div>
                        <div style={{fontSize:12, color:'#888'}}>{userFriendlyAddress ? userFriendlyAddress.slice(0,6)+'...'+userFriendlyAddress.slice(-4) : 'No Wallet'}</div>
                    </div>
                </div>
                <TonConnectButton />
                <div style={{marginTop:20}}>
                    <button className="menu-item-button" style={{width:'100%', padding:15, textAlign:'left', background:'none', border:'none', borderBottom:'1px solid #eee'}} onClick={()=>setShowLeaderboardPage(true)}>🏆 Leaderboard</button>
                    <button className="menu-item-button" style={{width:'100%', padding:15, textAlign:'left', background:'none', border:'none', borderBottom:'1px solid #eee'}} onClick={()=>setShowDaoPage(true)}>🗳️ DAO</button>
                    <button className="menu-item-button" style={{width:'100%', padding:15, textAlign:'left', background:'none', border:'none', borderBottom:'1px solid #eee'}} onClick={()=>setShowInventoryPage(true)}>🎒 Inventory</button>
                    <button className="menu-item-button" style={{width:'100%', padding:15, textAlign:'left', background:'none', border:'none', borderBottom:'1px solid #eee'}} onClick={()=>setShowStakingPage(true)}>🔒 Staking</button>
                    <button className="menu-item-button" style={{width:'100%', padding:15, textAlign:'left', background:'none', border:'none'}} onClick={()=>setShowTransactionHistoryPage(true)}>📜 History</button>
                </div>
                <div style={{marginTop:15, textAlign:'center'}}>
                    Referrals: <span className="text-neon">{referralCount}</span>
                    <button className="cta-btn secondary" style={{marginTop:10, fontSize:12, padding:8}} onClick={()=>{navigator.clipboard.writeText(`https://t.me/BluppieBot?start=${userFriendlyAddress}`); showToast("Copied Link!");}}>INVITE FRIEND</button>
                </div>
            </div>
        );
    };

    return (
        <div className="container" style={{paddingBottom: 100}}>
            {renderContent()}
            <Toast show={toast.show} message={toast.message} type={toast.type} />
            <NewPackModal show={showNewPackModal} onClose={()=>setShowNewPackModal(false)} showToast={showToast} handlePackPurchase={handlePackPurchase} packsSold={packsSold} userBalance={userTonBalance} />
            <BuyModal show={showBuyModal} onClose={()=>setShowBuyModal(false)} nft={selectedNFTToBuy} currentCurrency={currentCurrency} showToast={showToast} handlePurchase={handlePurchase} tonBalance={userTonBalance} pieBalance={userPieBalance} userAddress={userFriendlyAddress} />
            <InventoryDetailModal show={showInventoryDetail} onClose={()=>setShowInventoryDetail(false)} nft={selectedInventoryNft} showToast={showToast} isListed={selectedInventoryNft?.status==='Listed'} deList={handleDeList} userAddress={userFriendlyAddress} />
            <BalanceTooltipModal show={showBalanceTooltip} onClose={()=>setShowBalanceTooltip(false)} usd={currentUSDValue} pie={userPieBalance} price={PIE_USD_PRICE} />
            
            {showSortModal && <div className="modal-overlay" onClick={()=>setShowSortModal(false)}><div className="modal-content" onClick={e=>e.stopPropagation()}><h3>SORT</h3>{['Price: Ascending', 'Price: Descending', 'Number: Ascending', 'Number: Descending'].map(o=><button key={o} className="modal-item" style={{width:'100%', padding:10, textAlign:'left'}} onClick={()=>{setCurrentSort(o); setShowSortModal(false);}}>{o}</button>)}</div></div>}
            
            {showFilterModal && <div className="modal-overlay" onClick={()=>setShowFilterModal(false)}><div className="modal-content" onClick={e=>e.stopPropagation()}><h3>CURRENCY</h3><button className="modal-item" style={{width:'100%', padding:15}} onClick={()=>{setCurrentCurrency('TON'); setShowFilterModal(false);}}>TON</button><button className="modal-item" style={{width:'100%', padding:15}} onClick={()=>{setCurrentCurrency('PIE'); setShowFilterModal(false);}}>PIE</button></div></div>}

            {showGetPieModal && <div className="modal-overlay" onClick={()=>setShowGetPieModal(false)}><div className="modal-content" onClick={e=>e.stopPropagation()}><h3>BUY PIE</h3><button className="modal-item" style={{width:'100%', padding:15}} onClick={()=>{window.open(LINK_BLUM_SWAP); setShowGetPieModal(false);}}>BLUM SWAP</button></div></div>}

            {showSocialsModal && <div className="modal-overlay" onClick={()=>setShowSocialsModal(false)}><div className="modal-content" onClick={e=>e.stopPropagation()}><h3>SOCIALS</h3><button className="modal-item" style={{width:'100%', padding:15}} onClick={()=>{window.open(SOCIAL_TWITTER); setShowSocialsModal(false);}}>Twitter</button><button className="modal-item" style={{width:'100%', padding:15}} onClick={()=>{window.open(SOCIAL_TELEGRAM); setShowSocialsModal(false);}}>Telegram</button></div></div>}

            <nav className="bottom-nav" style={{position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 400, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000}}>
                <div className={`nav-item ${activeTab==='Menu'?'active':''}`} onClick={()=>setActiveTab('Menu')}><Icons.Menu/></div>
                <div className={`nav-item ${activeTab==='Marketplace'?'active':''}`} onClick={()=>setActiveTab('Marketplace')}><Icons.Market/></div>
                <div className={`nav-item ${activeTab==='Profile'?'active':''}`} onClick={()=>setActiveTab('Profile')}><Icons.Profile/></div>
            </nav>
        </div>
    );
}

export default App;
