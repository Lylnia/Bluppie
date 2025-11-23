import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

// --- ASSETS & CONSTANTS ---
const BLUPPIE_NFT_URL = "https://i.imgur.com/TDukTkX.png"; 
const PIE_JETTON_MASTER = "EQDgIHYB656hYyTJKh0bdO2ABNAcLXa45wIhJrApgJE8Nhxk"; 
const TON_API_URL = "https://tonapi.io/v2/accounts"; 
const PACK_PRICE = 3.00; 
const TOTAL_PACK_SUPPLY = 1000;

// --- MOCK DATA (Restored for Demo) ---
const INITIAL_INVENTORY = [
    { id: 1, name: "Plush Bluppie", itemNumber: 1, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
    { id: 2, name: "Plush Bluppie", itemNumber: 10, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
];

const INITIAL_MARKETPLACE = [
    { id: 875, price: 42.85, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 967, price: 42.90, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 279, price: 42.95, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 767, price: 43.00, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
];

// --- ICONS ---
const Icons = {
    Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>,
    Market: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>,
    Profile: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
    Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>,
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    Stake: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>,
    History: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>,
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
};

function App() {
    // --- CORE STATE ---
    const userFriendlyAddress = useTonAddress();
    const [activeTab, setActiveTab] = useState('Menu');
    const [pieBalance, setPieBalance] = useState<string>('0.00');
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- GAME STATE (Restored) ---
    const [inventory, setInventory] = useState(INITIAL_INVENTORY);
    const [marketplace, setMarketplace] = useState(INITIAL_MARKETPLACE);
    const [packsSold, setPacksSold] = useState(10);
    
    // --- MODAL STATES ---
    const [showPackModal, setShowPackModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    
    // --- NAVIGATION STATES (Sub-pages) ---
    const [subPage, setSubPage] = useState<string | null>(null); // 'Inventory', 'Staking'

    // --- INIT ---
    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        if (WebApp.initDataUnsafe.user) {
            setUserData(WebApp.initDataUnsafe.user);
        } else {
            setUserData({ first_name: "Vibe", username: "Coder", photo_url: BLUPPIE_NFT_URL });
        }
        
        // Disable context menu globally
        const handleContextMenu = (e: Event) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // --- FETCH REAL BALANCE ---
    const fetchPieBalance = async () => {
        if (!userFriendlyAddress) return;
        setIsLoading(true);
        try {
            const response = await axios.get(`${TON_API_URL}/${userFriendlyAddress}/jettons/${PIE_JETTON_MASTER}`);
            const rawBalance = response.data.balance;
            const decimals = response.data.jetton.decimals || 9;
            const formatted = (Number(rawBalance) / Math.pow(10, decimals)).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            setPieBalance(formatted);
        } catch (error) {
            console.log("User likely has 0 PIE or API rate limit", error);
            setPieBalance("0.00");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (userFriendlyAddress) fetchPieBalance(); }, [userFriendlyAddress]);

    // --- ACTIONS ---
    const handlePackPurchase = () => {
        // Simulate purchase
        setPacksSold(prev => prev + 1);
        const newItem = { id: Date.now(), name: "Plush Bluppie", itemNumber: packsSold + 1, imageUrl: BLUPPIE_NFT_URL, status: "Owned" };
        setInventory(prev => [...prev, newItem]);
        setShowPackModal(false);
        alert("PACK OPENED! New Bluppie added to Inventory.");
    };

    const handleBuyMarketItem = () => {
        // Simulate Market Buy
        if (selectedItem) {
            const newItem = { ...selectedItem, status: 'Owned', itemNumber: selectedItem.id };
            setInventory(prev => [...prev, newItem]);
            setMarketplace(prev => prev.filter(i => i.id !== selectedItem.id));
            setShowBuyModal(false);
            alert(`Successfully bought ${selectedItem.name}!`);
        }
    };

    // --- SUB-PAGES RENDERERS ---
    if (subPage === 'Inventory') {
        return (
            <div className="container" style={{paddingTop: 16}}>
                <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
                    <button onClick={() => setSubPage(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}><Icons.Back /></button>
                    <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Inventory</h2>
                    <div style={{ width: 24 }}></div>
                </div>
                <div className="item-grid">
                    {inventory.map((item) => (
                        <div key={item.id} className="marketplace-card">
                            <div className="card-image-wrapper">
                                <img src={item.imageUrl} className="card-image" />
                            </div>
                            <div style={{ padding: '12px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                                    {item.name} <span className="text-neon">#{item.itemNumber}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (subPage === 'Staking') {
        return (
            <div className="container" style={{paddingTop: 16}}>
                <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
                    <button onClick={() => setSubPage(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                    <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Staking Pool</h2>
                    <div style={{ width: 24 }}></div>
                </div>
                <div className="holo-panel pulse-glow" style={{textAlign:'center', padding:30}}>
                    <div className="text-dim">APY</div>
                    <div className="text-neon" style={{fontSize:40, fontWeight:800}}>120%</div>
                    <div className="text-dim" style={{marginTop:20}}>YOUR BALANCE</div>
                    <div style={{fontSize:20}}>{pieBalance} $PIE</div>
                    <button className="cta-btn" style={{marginTop:20}} onClick={() => alert("Staking Simulated!")}>STAKE MAX</button>
                </div>
            </div>
        );
    }

    // --- MAIN TABS RENDERER ---
    const renderContent = () => {
        if (activeTab === 'Menu') {
            return (
                <React.Fragment>
                    <div className="holo-panel pulse-glow">
                        <div className="balance-display">
                            <div className="text-dim" style={{ fontSize: 12, marginBottom: 5 }}>TOTAL BALANCE</div>
                            <div className="balance-pie" style={{ fontSize: 36, color: 'var(--neon-cyan)' }}>
                                {pieBalance} $PIE
                            </div>
                            {userFriendlyAddress ? (
                                <div style={{ fontSize: 12, color: 'var(--neon-green)', marginTop: 5, display:'flex', alignItems:'center', gap:5 }}>
                                    ● WALLET CONNECTED
                                    <button onClick={fetchPieBalance} style={{background:'none', border:'none', color:'inherit', cursor:'pointer', opacity: isLoading ? 0.5 : 1}}><Icons.Refresh /></button>
                                </div>
                            ) : <div style={{ fontSize: 12, color: 'var(--neon-red)', marginTop: 5 }}>● WALLET DISCONNECTED</div>}
                        </div>
                        <div style={{ marginTop: 15 }}>
                            <TonConnectButton className="custom-ton-btn" />
                        </div>
                    </div>

                    {/* PRE-SALE SECTION RESTORED */}
                    <div className="holo-panel">
                        <div className="nft-title" style={{justifyContent:'center'}}><span className="text-neon"></span> New Packages & Pre-Sale</div> 
                        <div className="nft-scroll">
                            <div className="nft-card" onClick={() => setShowPackModal(true)} style={{ minWidth: '280px' }}>
                                <div style={{ padding: '15px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Plush Bluppie</div>
                                    <img className="nft-image" src={BLUPPIE_NFT_URL} />
                                    <div className="text-neon" style={{ marginTop: '10px', fontSize: '20px', fontWeight: '900' }}>{PACK_PRICE.toFixed(2)} TON</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        }
        
        if (activeTab === 'Marketplace') {
            return (
                <div className="marketplace-container">
                    <h2 style={{ fontSize: '22px', marginBottom: 16 }}> <span className="text-neon">Marketplace</span></h2>
                    <div className="item-grid">
                        {marketplace.map((item) => (
                            <div key={item.id} className="marketplace-card" onClick={() => {setSelectedItem(item); setShowBuyModal(true);}}>
                                <div className="card-image-wrapper"><img src={item.imageUrl} className="card-image"/></div>
                                <div style={{ padding: '10px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{item.name} <span className="text-neon">#{item.id}</span></div>
                                    <div className="card-price-tag">{item.price.toFixed(2)} TON</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'Profile') {
            return (
                <div className="holo-panel">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <img src={userData?.photo_url || BLUPPIE_NFT_URL} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--neon-cyan)', padding: 2 }} />
                        <div style={{ marginLeft: '15px' }}>
                            <div style={{ fontSize: '20px', fontWeight: '700' }}>{userData?.first_name}</div>
                            <div className="text-dim">@{userData?.username}</div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setSubPage('Inventory')}>
                            <span style={{display:'flex', alignItems:'center', gap:10}}> Inventory</span> <span>&gt;</span>
                        </button>
                        <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setSubPage('Staking')}>
                            <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Stake /> Staking</span> <span>&gt;</span>
                        </button>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="app-container">
            <div className="noise-overlay"></div>
            
            {/* --- MODALS --- */}
            {showPackModal && (
                <div className="modal-overlay" style={{position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)'}} onClick={() => setShowPackModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'90%', maxWidth:400, padding:24, borderRadius:24, border:'1px solid var(--neon-cyan)', background:'#0a0a0a'}}>
                        <div style={{textAlign:'center', marginBottom:20}}>
                            <h2 className="text-neon">Plush Pack</h2>
                            <img src={BLUPPIE_NFT_URL} style={{width:150, margin:'20px 0'}} />
                            <div className="text-dim">{packsSold} / {TOTAL_PACK_SUPPLY} MINTED</div>
                        </div>
                        <button className="cta-btn" onClick={handlePackPurchase}>MINT FOR {PACK_PRICE.toFixed(2)} TON</button>
                    </div>
                </div>
            )}

            {showBuyModal && selectedItem && (
                <div className="modal-overlay" style={{position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)'}} onClick={() => setShowBuyModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'90%', maxWidth:400, padding:24, borderRadius:24, border:'1px solid var(--neon-cyan)', background:'#0a0a0a'}}>
                        <h2 className="text-neon" style={{textAlign:'center'}}>CONFIRM BUY</h2>
                        <div style={{display:'flex', gap:15, margin:'20px 0'}}>
                            <img src={selectedItem.imageUrl} style={{width:80, borderRadius:12}} />
                            <div>
                                <div style={{fontWeight:700}}>{selectedItem.name}</div>
                                <div className="text-neon">#{selectedItem.id}</div>
                            </div>
                        </div>
                        <div className="holo-panel" style={{padding:15, marginBottom:20}}>
                            <div style={{display:'flex', justifyContent:'space-between'}}>
                                <span className="text-dim">COST:</span>
                                <span className="text-neon" style={{fontWeight:700}}>{selectedItem.price.toFixed(2)} TON</span>
                            </div>
                        </div>
                        <button className="cta-btn" onClick={handleBuyMarketItem}>CONFIRM TRANSACTION</button>
                    </div>
                </div>
            )}

            <div className="container">
                <div style={{marginBottom: 80}}>
                    {renderContent()}
                </div>

                <nav className="bottom-nav">
                    <div className={`nav-item ${activeTab === 'Menu' ? 'active' : ''}`} onClick={() => setActiveTab('Menu')}>
                        <Icons.Menu /><span style={{marginTop:4}}>Home</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'Marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('Marketplace')}>
                        <Icons.Market /><span style={{marginTop:4}}>Marketplace</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => setActiveTab('Profile')}>
                        <Icons.Profile /><span style={{marginTop:4}}>Profile</span>
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default App;
