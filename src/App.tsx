import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

// --- ASSETS & CONSTANTS ---
const BLUPPIE_NFT_URL = "https://i.imgur.com/TDukTkX.png"; 
const BLUM_LOGO_URL = "https://s2.coinmarketcap.com/static/img/coins/200x200/33154.png"; 
const PIE_LOGO_URL = "https://i.imgur.com/GMjw61v.jpeg"; 
const TON_LOGO_URL = "https://ton.org/icons/custom/ton_logo.svg";
const TWITTER_LOGO_URL = "https://pbs.twimg.com/profile_images/1955359038532653056/OSHY3ewP_400x400.jpg";
const TELEGRAM_LOGO_URL = "https://pbs.twimg.com/profile_images/1183117696730390529/LRDASku7_400x400.jpg";
const DISCORD_LOGO_URL = "https://pbs.twimg.com/profile_images/1795851438956204032/rLl5Y48q_400x400.jpg";

const PIE_JETTON_MASTER = "EQDgIHYB656hYyTJKh0bdO2ABNAcLXa45wIhJrApgJE8Nhxk"; 
const TON_API_URL = "https://tonapi.io/v2/accounts"; 

const COMMISSION_PIE = 0.001; 
const COMMISSION_TON = 0.03;  
const TOTAL_PACK_SUPPLY = 1000;
const PACK_PRICE = 3.00; 
const PIE_USD_PRICE = 0.0000013; 
const TON_USD_PRICE = 1.50;

const LINK_BLUM_SWAP = "https://t.me/blum/app";
const LINK_GAME = "https://t.me/BluppieBot"; 
const SOCIAL_TWITTER = "https://twitter.com/BluppieNFT";
const SOCIAL_TELEGRAM = "https://t.me/BluppieNFT";
const SOCIAL_DISCORD = "https://discord.gg/";

// --- ICONS (Restored Full Set from your HTML) ---
const Icons = {
    Back: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
    Menu: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>,
    Market: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>,
    Profile: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
    Info: () => <svg className="icon-svg" style={{width:16, height:16}} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>,
    Close: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    Check: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>,
    History: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>,
    Sort: () => <svg className="icon-svg" style={{width:16, height:16}} viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>,
    Filter: () => <svg className="icon-svg" style={{width:16, height:16}} viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>,
    Stake: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>,
    Friends: () => <svg className="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
};

// --- SUB COMPONENTS (Migrated from HTML) ---

function Toast({ show, message, type }: any) {
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

function InventoryPage({ handleBack, openDetails, inventory, isShowingListings, toggleView }: any) {
    const ownedNfts = inventory.filter((nft:any) => nft.status === 'Owned');
    const listedNfts = inventory.filter((nft:any) => nft.status === 'Listed');
    const displayedNfts = isShowingListings ? listedNfts : ownedNfts;

    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Inventory</h2>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="sort-list-row" style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <button 
                    className="action-btn" 
                    onClick={() => toggleView(false)}
                    style={{ flex: 1, borderColor: !isShowingListings ? 'var(--neon-cyan)' : '', color: !isShowingListings ? 'var(--neon-cyan)' : '' }}
                >
                    Owned ({ownedNfts.length})
                </button>
                <button 
                    className="action-btn" 
                    onClick={() => toggleView(true)}
                    style={{ flex: 1, borderColor: isShowingListings ? 'var(--neon-cyan)' : '', color: isShowingListings ? 'var(--neon-cyan)' : '' }}
                >
                    Listings ({listedNfts.length})
                </button>
            </div>

            <div className="nft-store" style={{ padding: '0 16px', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                <div className="item-grid">
                    {displayedNfts.map((item:any) => (
                        <div key={item.id} className="marketplace-card" onClick={() => openDetails(item)}>
                            <div className="card-image-wrapper">
                                <img src={item.imageUrl} alt={`${item.name} #${item.itemNumber}`} className="card-image" />
                            </div>
                            <div style={{ padding: '12px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '600', marginBottom: '8px' }}>
                                    {item.name} <span className="text-neon">#{item.itemNumber}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {displayedNfts.length === 0 && <div className="holo-panel" style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>EMPTY</div>}
            </div>
        </div>
    );
}

function ListingPage({ handleBack, inventory, showToast, finalizeListing }: any) {
    const [step, setStep] = useState('select'); 
    const [selectedNft, setSelectedNft] = useState<any>(null);
    const [listingCurrency, setListingCurrency] = useState<any>(null);
    const [listingPrice, setListingPrice] = useState(''); 

    const COMM_RATE = listingCurrency === 'TON' ? COMMISSION_TON : COMMISSION_PIE;
    const numericPrice = parseFloat(listingPrice || '0');
    const buyerPays = numericPrice;
    const commissionAmount = buyerPays * COMM_RATE;
    const sellerReceives = buyerPays - commissionAmount;
    
    const handleSelectNft = (nft:any) => {
        setSelectedNft(nft);
        setListingCurrency(null); 
        setListingPrice(''); 
        setStep('currency');
    };

    const handleFinalize = () => {
        if (numericPrice <= 0) return;
        finalizeListing(selectedNft.id, buyerPays.toFixed(4), listingCurrency);
    };

    const renderHeader = (title: string) => (
        <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
            <button 
                onClick={() => {
                    if (step === 'select') handleBack();
                    else if (step === 'currency') setStep('select');
                    else if (step === 'price') setStep('currency');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}
            >
                <Icons.Back />
            </button>
            <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '18px' }}>{title}</h2>
            <div style={{ width: 24 }}></div>
        </div>
    );

    const renderStepSelect = () => (
        <div style={{ padding: '0 16px' }}>
            <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'var(--font-head)' }}>
                 SELECT NFT FOR UPLOAD
            </div>
            <div className="item-grid">
                {inventory.map((item:any) => (
                    <div key={item.id} className="marketplace-card" onClick={() => handleSelectNft(item)}>
                        <div className="card-image-wrapper">
                            <img src={item.imageUrl} alt={`${item.name} #${item.itemNumber}`} className="card-image" />
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{item.name} #{item.itemNumber}</div>
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
                <div style={{ fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-head)', fontSize: '18px' }}>
                    NFT: <span className="text-neon">{selectedNft.name} #{selectedNft.itemNumber}</span>
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
                <div style={{ fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-head)' }}>
                    LISTING: <span className="text-neon">{selectedNft.name} #{selectedNft.itemNumber}</span> in {listingCurrency}
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

                <div style={{ padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>Buyer Pays:</span>
                        <span className="text-neon">{buyerPays.toLocaleString('en-US')} {listingCurrency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>Fee:</span>
                        <span style={{ color: 'var(--neon-red)' }}>- {commissionAmount.toLocaleString('en-US')} {listingCurrency}</span>
                    </div>
                    <hr style={{ borderColor: 'var(--color-glass-border)', margin: '10px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontFamily: 'var(--font-head)' }}>
                        <span>You Receive</span>
                        <span className="text-green">{sellerReceives.toLocaleString('en-US')} {listingCurrency}</span>
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

// --- APP COMPONENT ---

function App() {
    // -- REAL BACKEND DATA --
    const userFriendlyAddress = useTonAddress();
    const wallet = useTonWallet();
    const [userData, setUserData] = useState<any>(null);
    const [userPieBalance, setUserPieBalance] = useState<string>('0.00');
    const [isLoading, setIsLoading] = useState(false);

    // -- APP STATE --
    const [userInventory, setUserInventory] = useState([
        { id: 1, name: "Plush Bluppie", itemNumber: 1, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
        { id: 2, name: "Plush Bluppie", itemNumber: 10, imageUrl: BLUPPIE_NFT_URL, status: "Owned" },
    ]);
    const [marketplaceListings, setMarketplaceListings] = useState([
        { id: 875, price: 42.85, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
        { id: 967, price: 42.90, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
        { id: 279, price: 42.95, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
        { id: 767, price: 43.00, imageUrl: BLUPPIE_NFT_URL, name: "Plush Bluppie" },
    ]);
    
    const [activeTab, setActiveTab] = useState('Menu'); 
    const [showGetPieModal, setShowGetPieModal] = useState(false);
    const [showSocialsModal, setShowSocialsModal] = useState(false);
    const [showStakingPage, setShowStakingPage] = useState(false); 
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showNewPackModal, setShowNewPackModal] = useState(false);
    const [showBalanceTooltip, setShowBalanceTooltip] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedNFTToBuy, setSelectedNFTToBuy] = useState<any>(null);
    const [showInventoryPage, setShowInventoryPage] = useState(false);
    const [showListingPage, setShowListingPage] = useState(false);
    const [showInventoryDetail, setShowInventoryDetail] = useState(false);
    const [selectedInventoryNft, setSelectedInventoryNft] = useState<any>(null);
    const [isInventoryShowingListings, setIsInventoryShowingListings] = useState(false); 
    const [showTransactionHistoryPage, setShowTransactionHistoryPage] = useState(false); 

    const [currentSort, setCurrentSort] = useState('Price: Ascending');
    const [currentCurrency, setCurrentCurrency] = useState('TON');
    const [marketplaceSearch, setMarketplaceSearch] = useState('');
    const [packsSold, setPacksSold] = useState(10);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- INIT ---
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
            setUserPieBalance(formatted);
        } catch (error) {
            setUserPieBalance("0.00");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (userFriendlyAddress) fetchPieBalance(); }, [userFriendlyAddress]);

    // --- HELPER LOGIC ---
    const showToastMessage = (message: string, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleCloseFullPageViews = () => {
        setShowInventoryPage(false); 
        setShowListingPage(false); 
        setShowInventoryDetail(false);
        setShowStakingPage(false); 
        setShowTransactionHistoryPage(false); 
        setShowBuyModal(false);
    };

    const handleNavClick = (tab: string) => {
        handleCloseFullPageViews();
        setActiveTab(tab);
    };

    // --- MOCKED TRANSACTIONS (Since we don't have Smart Contract Write Access yet) ---
    const handlePackPurchase = () => {
        setPacksSold(prev => prev + 1);
        const newItem = { id: Date.now(), name: "Plush Bluppie", itemNumber: packsSold + 1, imageUrl: BLUPPIE_NFT_URL, status: "Owned" };
        setUserInventory(prev => [...prev, newItem]);
        setShowNewPackModal(false);
        showToastMessage("Pack Unlocked! NFT added.", 'success');
    };

    const handleFinalizeListing = (id: number, price: string, currency: string) => {
        setUserInventory(prev => prev.map(nft => nft.id === id ? { ...nft, status: 'Listed', price, currency } : nft));
        showToastMessage(`Listed for ${price} ${currency}`, 'success');
        handleCloseFullPageViews();
    };

    const handlePurchase = (nftId: number, price: number, currency: string) => {
        // Logic to move item from Market to Inventory
        const item = marketplaceListings.find(i => i.id === nftId);
        if(item) {
            setUserInventory(prev => [...prev, {...item, status: 'Owned', itemNumber: item.id}]);
            setMarketplaceListings(prev => prev.filter(i => i.id !== nftId));
            showToastMessage('Purchase Successful', 'success');
            setShowBuyModal(false);
        }
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        // 1. SUB PAGES
        if (showInventoryPage) return <InventoryPage handleBack={handleCloseFullPageViews} openDetails={(nft:any)=>{setSelectedInventoryNft(nft); setShowInventoryDetail(true);}} inventory={userInventory} isShowingListings={isInventoryShowingListings} toggleView={setIsInventoryShowingListings} />;
        if (showListingPage) return <ListingPage handleBack={handleCloseFullPageViews} inventory={userInventory.filter(nft => nft.status === 'Owned')} showToast={showToastMessage} finalizeListing={handleFinalizeListing} />;
        
        // 2. STAKING PAGE (Restored)
        if (showStakingPage) {
            const dailyEarnings = 123.45; // Mock calc
            return (
                <div className="container" style={{ padding: '0' }}>
                    <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                        <button onClick={handleCloseFullPageViews} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                        <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Staking</h2>
                        <div style={{ width: 24 }}></div>
                    </div>
                    <div className="holo-panel pulse-glow" style={{textAlign:'center', padding:30}}>
                        <div className="text-dim">APY</div>
                        <div className="text-neon" style={{fontSize:40, fontWeight:800}}>120%</div>
                        <div className="text-dim" style={{marginTop:20}}>AVAILABLE:</div>
                        <div style={{fontSize:20}}>{userPieBalance} $PIE</div>
                        <div style={{marginTop: 20, padding: 15, border:'1px solid var(--color-glass-border)', borderRadius: 12}}>
                            <input type="number" placeholder="Amount..." style={{background:'transparent', border:'none', color:'#fff', width:'100%', textAlign:'center', fontSize: 18, outline:'none'}} />
                        </div>
                        <div style={{ padding: '10px', background: 'rgba(0,255,157,0.1)', borderRadius: '8px', border: '1px solid var(--neon-green)', margin: '15px 0', fontSize: '14px' }}>
                            Est. Daily Yield: <strong className="text-green">+{dailyEarnings.toFixed(2)} $PIE</strong>
                        </div>
                        <button className="cta-btn" onClick={()=>showToastMessage('Staked Successfully')}>STAKE</button>
                    </div>
                </div>
            );
        }

        if (showTransactionHistoryPage) {
            return (
                <div className="container" style={{ padding: '0' }}>
                    <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                        <button onClick={handleCloseFullPageViews} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                        <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Transactions</h2>
                        <div style={{ width: 24 }}></div>
                    </div>
                    <div style={{textAlign:'center', color:'gray', marginTop:30}}>No recent transactions</div>
                </div>
            );
        }

        // 3. MAIN TABS
        if (activeTab === 'Menu') {
            return (
                <React.Fragment>
                    <div className="holo-panel pulse-glow">
                        <div className="balance-display">
                            <div className="balance-usd">
                                $0.00 <button onClick={() => setShowBalanceTooltip(true)} style={{background:'none', border:'none', color: 'var(--color-text-secondary)', marginLeft: 8, cursor:'pointer'}}><Icons.Info /></button>
                            </div>
                            <div className="balance-pie">{userPieBalance} $PIE</div>
                        </div>
                        <div className="action-buttons">
                            <button className="action-btn" onClick={() => setShowStakingPage(true)}>STAKE</button>
                            <button className="action-btn" onClick={() => setShowSocialsModal(true)}>SOCIAL</button>
                        </div>
                        <button className="cta-btn" onClick={() => setShowGetPieModal(true)}>BUY $PIE</button>
                        
                        {/* REAL TON BUTTON */}
                        <div style={{marginTop: 15, display:'flex', justifyContent:'center'}}>
                            <TonConnectButton className="custom-ton-btn" />
                        </div>
                    </div>
                    
                    <div className="holo-panel">
                        <div className="nft-title" style={{justifyContent:'center'}}><span className="text-neon"></span> New Packages & Pre-Sale</div> 
                        <div className="nft-scroll">
                            <div className="nft-card" onClick={() => setShowNewPackModal(true)} style={{ minWidth: '280px' }}>
                                <div style={{ padding: '15px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Plush Bluppie</div>
                                    <img className="nft-image" src={BLUPPIE_NFT_URL} style={{width:140}} />
                                    <div className="text-neon" style={{ marginTop: '10px', fontSize: '20px', fontWeight: '900' }}>{PACK_PRICE.toFixed(2)} TON</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="holo-panel" style={{ textAlign: 'center' }}>
                        <div className="game-title text-neon" style={{marginBottom: 5}}>JOIN THE FLOW</div>
                        <div className="text-dim" style={{fontSize: 12, marginBottom: 15}}>EARN $BLUP IN THE BLUPPIE UNIVERSE</div>
                        <button className="cta-btn secondary" onClick={() => window.open(LINK_GAME, '_blank')}>SOON</button>
                    </div>
                </React.Fragment>
            );
        } else if (activeTab === 'Marketplace') {
            // Marketplace Logic with Search & Filter
            const filteredList = marketplaceListings.filter(item => item.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || item.id.toString().includes(marketplaceSearch));
            
            return (
                <div className="marketplace-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px' }}> <span className="text-neon">Marketplace</span></h2>
                        <button className="action-btn" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => setShowFilterModal(true)}>
                            {userFriendlyAddress ? '0.00 TON' : '--'} ▼
                        </button>
                    </div>
                     <input type="text" className="search-input" placeholder="Search ID..." value={marketplaceSearch} onChange={(e) => setMarketplaceSearch(e.target.value)} style={{marginBottom: 16}} />
                    <div className="sort-list-row" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <button className="action-btn" style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5}} onClick={() => setShowSortModal(true)}>
                            <Icons.Sort /> Sort
                        </button>
                        <button className="cta-btn" style={{flex:1, fontSize: 14, padding: 12}} onClick={() => setShowListingPage(true)}>
                            + LIST NFT
                        </button>
                    </div>
                    <div className="item-grid">
                        {filteredList.map((item) => (
                            <div key={item.id} className="marketplace-card" onClick={() => {setSelectedNFTToBuy(item); setShowBuyModal(true);}}>
                                <div className="card-image-wrapper"><img src={item.imageUrl} className="card-image"/></div>
                                <div style={{ padding: '10px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{item.name} <span className="text-neon">#{item.id}</span></div>
                                    <div className="card-price-tag">{item.price.toFixed(2)} {currentCurrency}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredList.length === 0 && <div className="text-dim" style={{textAlign:'center', marginTop: 20}}>NO MATCHES FOUND</div>}
                </div>
            );
        } else if (activeTab === 'Profile') {
            return (
                <React.Fragment>
                    <div className="holo-panel">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <img src={userData?.photo_url || BLUPPIE_NFT_URL} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--neon-cyan)', padding: 2 }} />
                            <div style={{ marginLeft: '15px' }}>
                                <div style={{ fontSize: '20px', fontWeight: '700' }}>{userData?.first_name}</div>
                                <div style={{ fontSize: '12px', color: !userFriendlyAddress ? 'var(--neon-red)' : 'var(--neon-green)', fontFamily: 'monospace' }}>
                                    {userFriendlyAddress ? userFriendlyAddress.slice(0, 6) + '...' + userFriendlyAddress.slice(-4) : 'not connected'}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setShowInventoryPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Market /> Inventory</span> <span>&gt;</span>
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setShowStakingPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Stake /> Staking</span> <span>&gt;</span>
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: '#fff', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none' }} onClick={() => setShowTransactionHistoryPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.History /> Transaction History</span> <span>&gt;</span>
                            </button>
                        </div>
                    </div>

                    <div className="holo-panel"> 
                        <div className="nft-title" style={{fontSize: 18}}><Icons.Friends /> Referrals</div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', justifyContent: 'space-between' }}>
                            <span className="text-dim">Total Invites</span>
                            <span className="text-neon" style={{ fontSize: '18px', fontWeight: '800' }}>0</span>
                        </div>
                        <button className="cta-btn" onClick={async () => { await navigator.clipboard.writeText(userFriendlyAddress || ''); showToastMessage('UPLINK COPIED'); }}>Invite Friends</button>
                    </div>
                </React.Fragment>
            );
        }
    };

    return (
        <div className="app-container">
            <div className="noise-overlay"></div>
            <div className="container">
                {renderContent()}
                <Toast show={toast.show} message={toast.message} type={toast.type} />
                
                {/* MODALS */}
                <NewPackModal 
                    show={showNewPackModal} 
                    onClose={() => setShowNewPackModal(false)} 
                    showToast={showToastMessage} 
                    handlePackPurchase={handlePackPurchase} 
                    packsSold={packsSold} 
                    userBalance={200} // Mock balance for pack modal display
                />
                <BuyModal 
                    show={showBuyModal} 
                    onClose={() => setShowBuyModal(false)} 
                    nft={selectedNFTToBuy} 
                    currentCurrency={currentCurrency} 
                    showToast={showToastMessage} 
                    handlePurchase={handlePurchase}
                    tonBalance={200}
                    pieBalance={parseFloat(userPieBalance.replace(/,/g, ''))}
                />
                <InventoryDetailModal 
                    show={showInventoryDetail} 
                    onClose={() => setShowInventoryDetail(false)} 
                    nft={selectedInventoryNft} 
                    showToast={showToastMessage} 
                    isListed={selectedInventoryNft && selectedInventoryNft.status === 'Listed'} 
                    deList={(id:number) => {
                        setUserInventory(prev => prev.map(n => n.id === id ? {...n, status:'Owned'} : n));
                        setShowInventoryDetail(false);
                        showToastMessage('Delisted Successfully');
                    }} 
                />
                <BalanceTooltipModal show={showBalanceTooltip} onClose={() => setShowBalanceTooltip(false)} usd={(parseFloat(userPieBalance.replace(/,/g, '')) * PIE_USD_PRICE).toFixed(2)} pie={userPieBalance} price={PIE_USD_PRICE} />

                {/* SIMPLE MODALS (Sort/Filter/Socials) */}
                {showSortModal && (
                    <div className="modal-overlay" style={{position:'fixed', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center'}} onClick={() => setShowSortModal(false)}>
                        <div className="modal-content" style={{width:'100%', maxWidth: 480, padding: 24, borderRadius: '24px 24px 0 0', paddingBottom: 40}} onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-neon" style={{marginBottom:15}}>SORT BY</h3>
                            {['Price: Ascending', 'Price: Descending', 'Number: Ascending', 'Number: Descending'].map(opt => (
                                <button key={opt} className="modal-item" style={{width:'100%', padding:10, textAlign:'left'}} onClick={()=>{setCurrentSort(opt); setShowSortModal(false);}}>{opt}</button>
                            ))}
                        </div>
                    </div>
                )}

                {showFilterModal && (
                     <div className="modal-overlay" style={{position:'fixed', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center'}} onClick={() => setShowFilterModal(false)}>
                        <div className="modal-content" style={{width:'100%', maxWidth: 480, padding: 24, borderRadius: '24px 24px 0 0', paddingBottom: 40}} onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-neon" style={{marginBottom:15}}>CURRENCY</h3>
                            <button className="modal-item" style={{width:'100%', padding:15, display:'flex', alignItems:'center'}} onClick={()=>{setCurrentCurrency('TON'); setShowFilterModal(false);}}><img src={TON_LOGO_URL} width="20" style={{marginRight:10}}/> TON</button>
                            <button className="modal-item" style={{width:'100%', padding:15, display:'flex', alignItems:'center', marginTop:10}} onClick={()=>{setCurrentCurrency('PIE'); setShowFilterModal(false);}}><img src={PIE_LOGO_URL} width="20" style={{marginRight:10}}/> PIE</button>
                        </div>
                    </div>
                )}

                {showGetPieModal && (
                     <div className="modal-overlay" style={{position:'fixed', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center'}} onClick={() => setShowGetPieModal(false)}>
                        <div className="modal-content" style={{width:'100%', maxWidth: 480, padding: 24, borderRadius: '24px 24px 0 0', paddingBottom: 40}} onClick={(e) => e.stopPropagation()}>
                            <div style={{textAlign:'center', marginBottom:15}}><img src={PIE_LOGO_URL} width="50" style={{borderRadius:'50%'}}/></div>
                            <h3 className="text-neon" style={{textAlign:'center', marginBottom:20}}>BUY $PIE</h3>
                            <button className="modal-item" style={{width:'100%', padding:15, display:'flex', alignItems:'center'}} onClick={()=>{window.open(LINK_BLUM_SWAP, '_blank'); setShowGetPieModal(false);}}>
                                <img src={BLUM_LOGO_URL} width="30" style={{marginRight:10, borderRadius:'50%'}}/> BLUM
                            </button>
                        </div>
                    </div>
                )}
                
                {showSocialsModal && (
                     <div className="modal-overlay" style={{position:'fixed', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center'}} onClick={() => setShowSocialsModal(false)}>
                        <div className="modal-content" style={{width:'100%', maxWidth: 480, padding: 24, borderRadius: '24px 24px 0 0', paddingBottom: 40}} onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-neon" style={{textAlign:'center', marginBottom:20}}>COMMUNITY UPLINK</h3>
                            <button className="modal-item" style={{width:'100%', padding:15, display:'flex', alignItems:'center', marginBottom:10}} onClick={()=>{window.open(SOCIAL_TWITTER, '_blank'); setShowSocialsModal(false);}}>
                                <img src={TWITTER_LOGO_URL} width="30" style={{marginRight:10, borderRadius:'50%'}}/> Twitter
                            </button>
                            <button className="modal-item" style={{width:'100%', padding:15, display:'flex', alignItems:'center', marginBottom:10}} onClick={()=>{window.open(SOCIAL_TELEGRAM, '_blank'); setShowSocialsModal(false);}}>
                                <img src={TELEGRAM_LOGO_URL} width="30" style={{marginRight:10, borderRadius:'50%'}}/> Telegram
                            </button>
                            <button className="modal-item" style={{width:'100%', padding:15, display:'flex', alignItems:'center'}} onClick={()=>{window.open(SOCIAL_DISCORD, '_blank'); setShowSocialsModal(false);}}>
                                <img src={DISCORD_LOGO_URL} width="30" style={{marginRight:10, borderRadius:'50%'}}/> Discord
                            </button>
                        </div>
                    </div>
                )}

                <nav className="bottom-nav">
                    <div className={`nav-item ${activeTab === 'Menu' ? 'active' : ''}`} onClick={() => handleNavClick('Menu')}>
                        <Icons.Menu /><span>Home</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'Marketplace' ? 'active' : ''}`} onClick={() => handleNavClick('Marketplace')}>
                        <Icons.Market /><span>Market</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => handleNavClick('Profile')}>
                        <Icons.Profile /><span>Profile</span>
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default App;
