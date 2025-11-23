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
// Social Links
const SOCIAL_TWITTER = "https://twitter.com/BluppieNFT";
const SOCIAL_TELEGRAM = "https://t.me/BluppieNFT";
const SOCIAL_DISCORD = "https://discord.gg/";
const LINK_GAME = "https://t.me/BluppieBot"; 
const LINK_BLUM_SWAP = "https://t.me/blum/app";

// --- ICONS (Full Set) ---
const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
    Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>,
    Market: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>,
    Profile: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
    Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>,
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>,
    History: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>,
    Sort: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>,
    Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>,
    Stake: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>,
    Friends: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
};

// --- MOCK DATA ---
const INITIAL_INVENTORY = [
    { id: 1, name: "Plush Bluppie", itemNumber: 1, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
    { id: 2, name: "Plush Bluppie", itemNumber: 10, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
    { id: 3, name: "Plush Bluppie", itemNumber: 100, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
];
const INITIAL_MARKETPLACE = [
    { id: 875, price: 42.85, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 967, price: 42.90, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 279, price: 42.95, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 767, price: 43.00, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 101, price: 43.10, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    { id: 444, price: 43.25, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
];
const MOCK_TRANSACTIONS = [
    { id: 1, type: 'List', item: 'Plush Bluppie #100', amount: 2.95, currency: 'TON', status: 'Active' },
    { id: 2, type: 'Buy', item: 'Plush Bluppie Package', amount: 3.00, currency: 'TON', status: 'Completed' },
];

// --- COMPONENTS ---
function App() {
    // Core Web3 & Telegram State
    const userFriendlyAddress = useTonAddress();
    const [userData, setUserData] = useState<any>(null);
    const [pieBalance, setPieBalance] = useState<string>('0.00');
    const [isLoading, setIsLoading] = useState(false);

    // Navigation & UI State
    const [activeTab, setActiveTab] = useState('Menu');
    const [subPage, setSubPage] = useState<string | null>(null);
    
    // Game Logic State
    const [inventory, setInventory] = useState(INITIAL_INVENTORY);
    const [marketplace, setMarketplace] = useState(INITIAL_MARKETPLACE);
    const [isInventoryShowingListings, setIsInventoryShowingListings] = useState(false);
    const [packsSold, setPacksSold] = useState(10);
    const [marketplaceSearch, setMarketplaceSearch] = useState('');

    // Modals
    const [showPackModal, setShowPackModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSocialsModal, setShowSocialsModal] = useState(false);
    const [showGetPieModal, setShowGetPieModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        if (WebApp.initDataUnsafe.user) {
            setUserData(WebApp.initDataUnsafe.user);
        } else {
            setUserData({ first_name: "Vibe", username: "Coder", photo_url: BLUPPIE_NFT_URL });
        }
        
        const handleContextMenu = (e: Event) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // --- FETCH REAL PIE BALANCE ---
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
            setPieBalance("0.00");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (userFriendlyAddress) fetchPieBalance(); }, [userFriendlyAddress]);

    // --- ACTION HANDLERS ---
    const handlePackPurchase = () => {
        setPacksSold(prev => prev + 1);
        const newItem = { id: Date.now(), name: "Plush Bluppie", itemNumber: packsSold + 1, imageUrl: BLUPPIE_NFT_URL, status: "Owned" };
        setInventory(prev => [...prev, newItem]);
        setShowPackModal(false);
        alert('Pack Opened!');
    };

    const handleBuyMarketItem = () => {
        if (selectedItem) {
            const newItem = { ...selectedItem, status: 'Owned', itemNumber: selectedItem.id };
            setInventory(prev => [...prev, newItem]);
            setMarketplace(prev => prev.filter(i => i.id !== selectedItem.id));
            setShowBuyModal(false);
            alert('Purchase Successful!');
        }
    };

    // --- RENDERERS ---
    
    if (subPage === 'Inventory') {
        const ownedNfts = inventory.filter(nft => nft.status === 'Owned');
        const listedNfts = inventory.filter(nft => nft.status === 'Listed');
        const displayedNfts = isInventoryShowingListings ? listedNfts : ownedNfts;

        return (
            <div className="container">
                <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
                    <button onClick={() => setSubPage(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}><Icons.Back /></button>
                    <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Inventory</h2>
                    <div style={{ width: 24 }}></div>
                </div>
                
                {/* Inventory Toggles */}
                <div style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={() => setIsInventoryShowingListings(false)} style={{ flex: 1, borderColor: !isInventoryShowingListings ? 'var(--neon-cyan)' : '', color: !isInventoryShowingListings ? 'var(--neon-cyan)' : '' }}>Owned ({ownedNfts.length})</button>
                    <button className="action-btn" onClick={() => setIsInventoryShowingListings(true)} style={{ flex: 1, borderColor: isInventoryShowingListings ? 'var(--neon-cyan)' : '', color: isInventoryShowingListings ? 'var(--neon-cyan)' : '' }}>Listings ({listedNfts.length})</button>
                </div>

                <div className="item-grid">
                    {displayedNfts.map((item) => (
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
                {displayedNfts.length === 0 && <div className="text-dim" style={{textAlign:'center', marginTop:30}}>EMPTY</div>}
            </div>
        );
    }

    if (subPage === 'Staking') {
        return (
            <div className="container">
                <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
                    <button onClick={() => setSubPage(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                    <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Staking Pool</h2>
                    <div style={{ width: 24 }}></div>
                </div>
                <div className="holo-panel pulse-glow" style={{textAlign:'center', padding:30}}>
                    <div className="text-dim">APY</div>
                    <div className="text-neon" style={{fontSize:40, fontWeight:800}}>120%</div>
                    <div className="text-dim" style={{marginTop:20}}>AVAILABLE TO STAKE</div>
                    <div style={{fontSize:20, fontFamily: 'var(--font-head)'}}>{pieBalance} $PIE</div>
                    <div style={{marginTop: 20, padding: 15, border:'1px solid var(--color-glass-border)', borderRadius: 12}}>
                        <input type="number" placeholder="Amount..." style={{background:'transparent', border:'none', color:'#fff', width:'100%', textAlign:'center', fontSize: 18, outline:'none'}} />
                    </div>
                    <button className="cta-btn" style={{marginTop:20}}>STAKE NOW</button>
                </div>
            </div>
        );
    }

    if (subPage === 'History') {
        return (
            <div className="container">
                <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
                    <button onClick={() => setSubPage(null)} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                    <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Transactions</h2>
                    <div style={{ width: 24 }}></div>
                </div>
                <div style={{ padding: '0 16px' }}>
                    {MOCK_TRANSACTIONS.map((tx) => (
                        <div key={tx.id} className="holo-panel" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div>
                                <div style={{ fontWeight: '700', color: '#fff', fontFamily: 'var(--font-head)' }}>
                                    <span style={{ color: tx.type.includes('Buy') ? 'var(--neon-red)' : 'var(--neon-green)' }}>{tx.type.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{tx.item}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="text-neon">{tx.amount} {tx.currency}</div>
                                <div style={{ fontSize: '10px', opacity: 0.5 }}>{tx.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (activeTab === 'Menu') {
            return (
                <React.Fragment>
                    <div className="holo-panel pulse-glow">
                        <div className="balance-display">
                            <div className="text-dim" style={{ fontSize: 12, marginBottom: 5 }}>TOTAL BALANCE</div>
                            <div className="balance-pie" style={{ fontSize: 36, color: 'var(--neon-cyan)' }}>{pieBalance} $PIE</div>
                            {userFriendlyAddress ? (
                                <div style={{ fontSize: 12, color: 'var(--neon-green)', marginTop: 5, display:'flex', alignItems:'center', gap:5 }}>
                                    ● CONNECTED <button onClick={fetchPieBalance} style={{background:'none', border:'none', color:'inherit', cursor:'pointer', opacity: isLoading?0.5:1}}><Icons.Refresh /></button>
                                </div>
                            ) : (
                                <div style={{ fontSize: 12, color: 'var(--neon-red)', marginTop: 5 }}>● DISCONNECTED</div>
                            )}
                        </div>
                        
                        <div className="action-buttons">
                            <button className="action-btn" onClick={() => setSubPage('Staking')}>STAKE</button>
                            <button className="action-btn" onClick={() => setShowSocialsModal(true)}>SOCIAL</button>
                        </div>
                        <button className="cta-btn" onClick={() => setShowGetPieModal(true)}>BUY $PIE</button>
                        
                        <div style={{marginTop: 20, display: 'flex', justifyContent: 'center'}}>
                            <TonConnectButton className="custom-ton-btn" />
                        </div>
                    </div>

                    <div className="holo-panel">
                        <div className="nft-title" style={{justifyContent:'center'}}><span className="text-neon"></span> New Packages & Pre-Sale</div> 
                        <div className="nft-scroll">
                            <div className="nft-card" onClick={() => setShowPackModal(true)} style={{ minWidth: '280px' }}>
                                <div style={{ padding: '15px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Plush Bluppie</div>
                                    <img src={BLUPPIE_NFT_URL} className="nft-image" style={{width: 140}} />
                                    <div className="text-neon" style={{ marginTop: '10px', fontSize: '20px', fontWeight: '900' }}>{PACK_PRICE.toFixed(2)} TON</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="holo-panel" style={{ textAlign: 'center' }}>
                        <div className="game-title text-neon" style={{marginBottom: 5}}>JOIN THE FLOW</div>
                        <div className="text-dim" style={{fontSize: 12, marginBottom: 15}}>EARN $BLUP IN THE BLUPPIE UNIVERSE</div>
                        <button className="cta-btn secondary" onClick={() => window.open(LINK_GAME, '_blank')}>PLAY GAME</button>
                    </div>
                </React.Fragment>
            );
        }
        
        if (activeTab === 'Marketplace') {
            // RESTORED: Marketplace Search & Filter Logic
            const filteredMarket = marketplace.filter(item => item.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || item.id.toString().includes(marketplaceSearch));

            return (
                <div className="marketplace-container">
                    {/* RESTORED: Header & Balance Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px' }}> <span className="text-neon">Marketplace</span></h2>
                        <button className="action-btn" style={{ padding: '8px 12px', fontSize: '12px' }}>
                            {userFriendlyAddress ? '220.50 TON' : '--- TON'} ▼
                        </button>
                    </div>

                    {/* RESTORED: Search Input */}
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search ID..." 
                        value={marketplaceSearch} 
                        onChange={(e) => setMarketplaceSearch(e.target.value)} 
                        style={{marginBottom: 16, width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-glass-border)', padding: 14, borderRadius: 12, color: 'var(--neon-cyan)', fontFamily: 'var(--font-head)', fontSize: 18, outline: 'none'}}
                    />

                    {/* RESTORED: Sort & List Buttons */}
                    <div className="sort-list-row" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <button className="action-btn" style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5}}>
                            <Icons.Sort /> Sort
                        </button>
                        <button className="cta-btn" style={{flex:1, fontSize: 14, padding: 12}} onClick={() => alert('Please connect wallet to list items')}>
                            + LIST NFT
                        </button>
                    </div>

                    <div className="item-grid">
                        {filteredMarket.map((item) => (
                            <div key={item.id} className="marketplace-card" onClick={() => {setSelectedItem(item); setShowBuyModal(true);}}>
                                <div className="card-image-wrapper"><img src={item.imageUrl} className="card-image"/></div>
                                <div style={{ padding: '10px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{item.name} <span className="text-neon">#{item.id}</span></div>
                                    <div className="card-price-tag">{item.price.toFixed(2)} TON</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredMarket.length === 0 && <div className="text-dim" style={{textAlign:'center', marginTop: 30}}>NO MATCHES FOUND</div>}
                </div>
            );
        }

        if (activeTab === 'Profile') {
            return (
                <React.Fragment>
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
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Market /> Inventory</span> <span>&gt;</span>
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setSubPage('Staking')}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Stake /> Staking</span> <span>&gt;</span>
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none' }} onClick={() => setSubPage('History')}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.History /> Transactions</span> <span>&gt;</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="holo-panel"> 
                        <div className="nft-title" style={{fontSize: 18}}><Icons.Friends /> Referrals</div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', justifyContent: 'space-between' }}>
                            <span className="text-dim">Total Invites</span>
                            <span className="text-neon" style={{ fontSize: '18px', fontWeight: '800' }}>0</span>
                        </div>
                        <button className="cta-btn" onClick={async () => { await navigator.clipboard.writeText(userFriendlyAddress); alert('Referral Link Copied!'); }}>Invite Friends</button>
                    </div>
                </React.Fragment>
            );
        }
    };

    return (
        <div className="app-container">
            <div className="noise-overlay"></div>
            
            {/* MODALS */}
            {showSocialsModal && (
                <div className="modal-overlay" style={{position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.85)'}} onClick={() => setShowSocialsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'100%', maxWidth:480, padding:24, borderRadius:'24px 24px 0 0', borderTop:'1px solid var(--neon-cyan)', background:'#0a0a0a'}}>
                        <h3 className="text-neon" style={{marginBottom:20, textAlign:'center'}}>COMMUNITY UPLINK</h3>
                        <button className="modal-item" style={{width:'100%', padding:15, marginBottom:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:12}} onClick={()=>window.open(SOCIAL_TWITTER, '_blank')}>Twitter</button>
                        <button className="modal-item" style={{width:'100%', padding:15, marginBottom:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:12}} onClick={()=>window.open(SOCIAL_TELEGRAM, '_blank')}>Telegram</button>
                        <button className="modal-item" style={{width:'100%', padding:15, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:12}} onClick={()=>window.open(SOCIAL_DISCORD, '_blank')}>Discord</button>
                    </div>
                </div>
            )}

            {showGetPieModal && (
                <div className="modal-overlay" style={{position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.85)'}} onClick={() => setShowGetPieModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'100%', maxWidth:480, padding:24, borderRadius:'24px 24px 0 0', borderTop:'1px solid var(--neon-cyan)', background:'#0a0a0a'}}>
                        <h3 className="text-neon" style={{marginBottom:20, textAlign:'center'}}>GET $PIE</h3>
                        <button className="modal-item" style={{width:'100%', padding:15, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:12}} onClick={()=>window.open(LINK_BLUM_SWAP, '_blank')}>Trade on BLUM</button>
                    </div>
                </div>
            )}

            {showPackModal && (
                <div className="modal-overlay" style={{position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)'}} onClick={() => setShowPackModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'90%', maxWidth:400, padding:24, borderRadius:24, border:'1px solid var(--neon-cyan)', background:'#0a0a0a'}}>
                        <div style={{textAlign:'center', marginBottom:20}}>
                            <h2 className="text-neon">Plush Pack</h2>
                            <div className="text-dim" style={{fontSize:12}}>LIMITED EDITION</div>
                            <img src={BLUPPIE_NFT_URL} style={{width:150, margin:'20px 0'}} />
                            <div className="text-dim">{packsSold} / {TOTAL_PACK_SUPPLY} MINTED</div>
                        </div>
                        <div className="holo-panel" style={{padding:12, display:'flex', justifyContent:'space-between'}}>
                            <span>COST:</span>
                            <span className="text-neon" style={{fontWeight:700}}>{PACK_PRICE.toFixed(2)} TON</span>
                        </div>
                        <button className="cta-btn" onClick={handlePackPurchase}>MINT NOW</button>
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
