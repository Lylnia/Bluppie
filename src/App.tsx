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
const BLUM_LOGO_URL = "https://s2.coinmarketcap.com/static/img/coins/200x200/33154.png"; 
const PIE_LOGO_URL = "https://i.imgur.com/GMjw61v.jpeg"; 
const TWITTER_LOGO_URL = "https://pbs.twimg.com/profile_images/1955359038532653056/OSHY3ewP_400x400.jpg";
const TELEGRAM_LOGO_URL = "https://pbs.twimg.com/profile_images/1183117696730390529/LRDASku7_400x400.jpg";
const DISCORD_LOGO_URL = "https://pbs.twimg.com/profile_images/1795851438956204032/rLl5Y48q_400x400.jpg";
const TON_LOGO_URL = "https://ton.org/icons/custom/ton_logo.svg"; 

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
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (error) {
        console.error("Backend API Error:", error);
        throw error;
    }
}

const waitForTransaction = async (address, expectedAmount) => {
    const maxRetries = 20; 
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
                        const isRecent = (now - txTime) < 120;
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

function LeaderboardPage({ handleBack }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiCall('/leaderboard')
            .then((data) => {
                setLeaders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
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
                    <div key={user.id} className="holo-panel" style={{ 
                        padding: '15px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '10px',
                        border: index === 0 ? '1px solid #FFD700' : '1px solid var(--color-glass-border)',
                        boxShadow: index === 0 ? '0 0 15px rgba(255, 215, 0, 0.2)' : ''
                    }}>
                        <div style={{ width: 30, fontSize: 18, fontWeight: 'bold', color: index < 3 ? 'var(--neon-purple)' : 'var(--color-text-secondary)' }}>
                            #{index + 1}
                        </div>
                        <div style={{ flexGrow: 1, marginLeft: 10 }}>
                            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{user.name} {user.badge}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                                {index === 0 ? "WHALE KING" : index < 3 ? "DIAMOND HAND" : "HOLDER"}
                            </div>
                        </div>
                        <div className="text-neon" style={{ fontWeight: 'bold' }}>
                            {user.score.toLocaleString()}
                        </div>
                    </div>
                ))}
                {!loading && leaders.length === 0 && <div className="text-dim" style={{textAlign:'center', marginTop:20}}>No Data Found</div>}
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
            await apiCall('/dao/vote', 'POST', {
                proposal_id: proposalId,
                voter_address: userAddress,
                option_index: optionIndex
            });
            showToast("Vote Submitted to Chain!", "success");
        } catch(e) {
            showToast("Voting Failed", "error");
        }
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
                                    <span>{opt}</span>
                                    <span>{prop.votes[idx]}%</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${prop.votes[idx]}%`, height: '100%', background: 'var(--neon-purple)' }}></div>
                                </div>
                                {prop.status === 'Active' && (
                                    <button 
                                        onClick={() => handleVote(prop.id, idx)}
                                        disabled={voting}
                                        style={{marginTop: 5, background:'none', border:'1px solid var(--color-glass-border)', color:'var(--color-text-dim)', borderRadius: 8, padding: '4px 8px', fontSize: 10, cursor:'pointer'}}
                                    >
                                        Vote This
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
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

function InventoryDetailModal({ show, onClose, nft, showToast, isListed, deList }) {
    if (!show || !nft) return null;
    const [recipientAddress, setRecipientAddress] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    const handleTransfer = async () => {
        if (!recipientAddress || recipientAddress.length < 10) {
            showToast("Invalid address!", 'error');
            return;
        }
        setIsTransferring(true);
        // Demo transfer
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        showToast(`TRANSFER COMPLETE: ${nft.name} #${nft.item_number} sent!`, 'success');
        setIsTransferring(false);
        onClose();
    };
    
    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor:'pointer' }}><Icons.Close /></button>
                
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h3 className="modal-title" style={{fontSize: 22, color: 'var(--neon-purple)'}}>{nft.name} <span style={{color:'var(--color-text-primary)'}}>#{nft.item_number}</span></h3>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', letterSpacing: '1px' }}>// NFT DETAILS</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px', border: '1px solid var(--neon-purple)', borderRadius: '16px', padding: '4px', boxShadow: '0 0 15px rgba(188,19,254,0.1)' }}>
                    <img src={nft.image_url || BLUPPIE_NFT_URL} style={{ width: '100%', height: '180px', objectFit: 'contain', borderRadius: '12px' }} />
                </div>

                {isListed && (
                    <div className="holo-panel" style={{ padding: '15px', marginBottom: '20px', background: 'var(--color-glass-panel)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neon-purple)' }}>
                            <span>PRICE:</span>
                            <span style={{fontFamily: 'var(--font-head)', fontSize: 18}}>{nft.price} {nft.currency || 'TON'}</span>
                        </div>
                    </div>
                )}
                
                {isListed && (
                    <button className="cta-btn" onClick={() => { deList(nft.id); onClose(); }} style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid #ff0055', color: '#ff0055', marginBottom: '15px' }}>
                        REMOVE FROM MARKETPLACE
                    </button>
                )}

                <div style={{ borderTop: '1px solid var(--color-glass-border)', paddingTop: '15px', marginBottom: '15px' }}>
                    <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>TRANSFER OWNERSHIP</h4>
                    <input type="text" placeholder="Recipient Address (0x...)" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} style={{marginBottom: '10px'}} />
                    <button className="cta-btn secondary" onClick={handleTransfer} disabled={!recipientAddress || isTransferring}>
                        {isTransferring ? 'TRANSFERRING...' : 'TRANSFER'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewPackModal({ show, onClose, showToast, handlePackPurchase, packsSold, userBalance }) {
    if (!show) return null;
    const TOTAL_SUPPLY = 1000;
    const progressPercent = (packsSold / TOTAL_SUPPLY) * 100; 
    
    // Satış bitti mi kontrolü
    const isSoldOut = packsSold >= TOTAL_SUPPLY;
    const canAfford = userBalance >= PACK_PRICE;

    const handlePurchase = () => {
        if (isSoldOut) return;
        if (!canAfford) { showToast(`INSUFFICIENT CREDITS: ${PACK_PRICE.toFixed(2)} TON required.`, 'error'); return; }
        handlePackPurchase(); 
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', borderRadius: '24px', padding: '24px', border: '1px solid var(--neon-purple)', boxShadow: '0 0 30px rgba(0,243,255,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor:'pointer' }}><Icons.Close /></button>
                
                <div style={{ textAlign: 'center' }}>
                    <h2 className="text-neon" style={{fontSize: '24px', marginBottom: '5px'}}>Plush Bluppie Package</h2>
                    <div className="text-dim" style={{fontSize: '12px', letterSpacing: '2px', marginBottom: '20px'}}>LIMITED NFT</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: '0', background: 'radial-gradient(circle, rgba(255, 92, 141, 0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
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
                    onClick={handlePurchase} 
                    disabled={!canAfford || isSoldOut}
                    style={{ background: isSoldOut ? '#555' : 'var(--neon-purple)' }}
                >
                    {isSoldOut ? 'SOLD OUT' : canAfford ? 'MINT' : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
        </div>
    );
}

function BuyModal({ show, onClose, nft, currentCurrency, showToast, handlePurchase, tonBalance, pieBalance }) {
    if (!show || !nft) return null;
    
    const listPriceTON = nft.price;
    const TON_TO_PIE_RATE = TON_USD_PRICE / PIE_USD_PRICE;
    
    const isTon = currentCurrency === 'TON';
    const price = isTon ? listPriceTON : (listPriceTON * TON_TO_PIE_RATE); 
    const balanceToCheck = isTon ? tonBalance : pieBalance;
    const canAfford = balanceToCheck >= price; 
    const currencyLogo = isTon ? TON_LOGO_URL : PIE_LOGO_URL;

    const handleConfirmBuy = async () => {
        if (!canAfford) { showToast(`ERROR: Insufficient funds.`, 'error'); return; }
        handlePurchase(nft.id, price, currentCurrency);
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--color-text-secondary)' }}><Icons.Close /></button>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div className="modal-title text-neon" style={{fontSize: 20}}>BUY NFT</div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <img src={nft.image_url || BLUPPIE_NFT_URL} style={{ width: '80px', height: '80px', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '18px', fontFamily: 'var(--font-head)', fontWeight: '700', color: 'var(--color-text-primary)' }}>{nft.name}</div>
                        <div className="text-neon">#{nft.item_number}</div>
                    </div>
                </div>

                <div className="holo-panel" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                        <span className="text-dim">TOTAL COST:</span>
                        <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', color: 'var(--color-text-primary)' }}>
                            <img src={currencyLogo} style={{ width: '16px', marginRight: '5px' }} />
                            {price.toLocaleString('en-US', {maximumFractionDigits: 4})} {currentCurrency}
                        </div>
                    </div>
                    <div style={{ height: 1, background: 'var(--color-glass-border)', margin: '10px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span className="text-dim">WALLET BALANCE:</span>
                        <span className={canAfford ? 'text-green' : 'text-neon'}>{balanceToCheck.toFixed(2)} {currentCurrency}</span>
                    </div>
                </div>
                
                <button className="cta-btn" onClick={handleConfirmBuy} disabled={!canAfford}>
                    {canAfford ? 'CONFIRM BUY' : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
        </div>
    );
}

function BalanceTooltipModal({ show, onClose, usd, pie, price }) {
    if (!show) return null;
    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '350px', borderRadius: '16px', padding: '20px' }}>
                <h3 className="modal-title" style={{fontSize: 18, marginBottom: 15, color: 'var(--neon-purple)'}}>ASSET VALUATION</h3>
                <div style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                    <span className="text-dim">Holding:</span> <span className="text-neon">{pie} PIE</span>
                </div>
                <div style={{ fontSize: '14px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                    <span className="text-dim">Market Price:</span> <span>${price}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-glass-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontFamily: 'var(--font-head)', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    <span>TOTAL</span> <span>${usd}</span>
                </div>
            </div>
        </div>
    );
}

function StakingPage({ handleBack, pieBalance, showToast }) {
    const [stakeAmount, setStakeAmount] = useState('');
    const numericPieBalance = parseFloat(typeof pieBalance === 'string' ? pieBalance.replace(/,/g, '') : pieBalance);
    const amount = parseFloat(stakeAmount);
    const dailyEarnings = amount * (1.20 / 365);

    const handleStake = () => {
        if (isNaN(amount) || amount <= 0) { showToast("Invalid input.", 'error'); return; }
        if (amount > numericPieBalance) { showToast("Insufficient funds.", 'error'); return; }
        showToast(`LOCKED: ${amount.toLocaleString()} $PIE into stake pool!`, 'success');
        setStakeAmount('');
    };

    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>Staking</h2>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="holo-panel pulse-glow">
                <div className="nft-title" style={{ marginBottom: '20px', justifyContent: 'center' }}> POOL METRICS</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div className="text-dim" style={{fontSize: 12}}>TVL</div>
                        <div className="text-neon" style={{fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700}}>200M $PIE</div>
                    </div>
                    <div>
                        <div className="text-dim" style={{fontSize: 12}}>APY</div>
                        <div className="text-green" style={{fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700}}>120%</div>
                    </div>
                </div>
            </div>

            <div className="holo-panel">
                <div className="nft-title" style={{fontSize: 16}}>MY STAKE</div>
                <div style={{ marginBottom: '15px', fontSize: '14px' }} className="text-dim">
                    AVAILABLE: <strong className="text-purple">{pieBalance} $PIE</strong>
                </div>
                <input
                    type="number"
                    placeholder="Amount to Stake"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    style={{ marginBottom: '15px' }}
                />
                {amount > 0 && !isNaN(amount) && (
                    <div style={{ padding: '10px', background: 'rgba(0,255,157,0.1)', borderRadius: '8px', border: '1px solid var(--neon-green)', marginBottom: '15px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        Est. Daily Yield: <strong className="text-green">+{dailyEarnings.toLocaleString('en-US', {maximumFractionDigits: 2})} $PIE</strong>
                    </div>
                )}
                <button className="cta-btn" onClick={handleStake}>STAKE</button>
            </div>
        </div>
    );
}

function TransactionHistoryPage({ handleBack, history }) {
    return (
        <div className="container" style={{ padding: '0' }}>
            <div className="holo-panel" style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '0 0 24px 24px', borderTop: 'none', marginTop: '-16px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>My Transactions</h2>
                <div style={{ width: 24 }}></div>
            </div>
            
            <div style={{ padding: '0 16px' }}>
                {history.map((tx) => (
                    <div key={tx.id} className="holo-panel" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontFamily: 'var(--font-head)' }}>
                                <span style={{ color: tx.type.includes('Buy') ? 'var(--neon-red)' : 'var(--neon-green)' }}>{tx.type.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{tx.item_name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            {tx.amount !== 'N/A' && <div className="text-neon">{tx.amount} {tx.currency}</div>}
                            <div style={{ fontSize: '10px', opacity: 0.5, color: 'var(--color-text-secondary)' }}>{tx.status}</div>
                        </div>
                    </div>
                ))}
                {history.length === 0 && <div style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>LOG EMPTY</div>}
            </div>
        </div>
    );
}

// --- MAIN APP ---

function App() {
    // --- TELEGRAM & TON HOOKS ---
    const userFriendlyAddress = useTonAddress(); 
    const [tonConnectUI] = useTonConnectUI();
    const [telegramUser, setTelegramUser] = useState(null);

    // --- STATE ---
    const [userPieBalance, setUserPieBalance] = useState(0); 
    const [userTonBalance, setUserTonBalance] = useState(0);
    const [userInventory, setUserInventory] = useState([]);
    
    const [activeTab, setActiveTab] = useState('Menu'); 
    const [showGetPieModal, setShowGetPieModal] = useState(false);
    const [showSocialsModal, setShowSocialsModal] = useState(false);
    const [showStakingPage, setShowStakingPage] = useState(false); 
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showNewPackModal, setShowNewPackModal] = useState(false);
    const [showBalanceTooltip, setShowBalanceTooltip] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedNFTToBuy, setSelectedNFTToBuy] = useState(null);
    const [showInventoryPage, setShowInventoryPage] = useState(false);
    const [showListingPage, setShowListingPage] = useState(false);
    const [showInventoryDetail, setShowInventoryDetail] = useState(false);
    const [selectedInventoryNft, setSelectedInventoryNft] = useState(null);
    const [isInventoryShowingListings, setIsInventoryShowingListings] = useState(false); 
    const [showTransactionHistoryPage, setShowTransactionHistoryPage] = useState(false);
    
    // YENİ STATE'LER
    const [showLeaderboardPage, setShowLeaderboardPage] = useState(false);
    const [showDaoPage, setShowDaoPage] = useState(false);

    const [currentSort, setCurrentSort] = useState('Price: Ascending');
    const [currentCurrency, setCurrentCurrency] = useState('TON');
    const [marketplaceListings, setMarketplaceListings] = useState([]);
    const [marketplaceSearch, setMarketplaceSearch] = useState('');
    
    // YENİ DÜZELTME: Sayaç 0'dan başlıyor
    const [packsSold, setPacksSold] = useState(0);
    
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- EFFECT: INITIALIZE ---
    useEffect(() => {
        // Telegram Init
        if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            setTelegramUser(WebApp.initDataUnsafe.user);
            WebApp.expand(); 
        }

        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // --- EFFECT: SCROLL LOCK ---
    const isAnyModalOpen = 
        showGetPieModal || showSocialsModal || showSortModal || showFilterModal || 
        showNewPackModal || showBalanceTooltip || showBuyModal || showInventoryDetail;

    useEffect(() => {
        if (isAnyModalOpen) { document.body.style.overflow = 'hidden'; } 
        else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [isAnyModalOpen]);

    // --- DATA FETCHING (TONAPI + BACKEND) ---
    const fetchAllData = async () => {
        if (!userFriendlyAddress) {
            setUserTonBalance(0);
            setUserPieBalance(0);
            return;
        }

        // 1. TONAPI (Gerçek Cüzdan Bakiyeleri)
        const headers = TONAPI_KEY ? { 'Authorization': `Bearer ${TONAPI_KEY}` } : {};

        try {
            const tonRes = await fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}`, { headers });
            if (tonRes.ok) {
                const tonData = await tonRes.json();
                if (tonData && tonData.balance) {
                    setUserTonBalance(parseInt(tonData.balance) / 1000000000);
                }
            }

            const jettonRes = await fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}/jettons`, { headers });
            if (jettonRes.ok) {
                const jettonData = await jettonRes.json();
                if (jettonData && jettonData.balances) {
                    const pieToken = jettonData.balances.find(token => {
                        return token.jetton.address === PIE_TOKEN_CONTRACT;
                    });
                    if (pieToken) {
                        const decimals = pieToken.jetton.decimals || 9; 
                        const rawBalance = parseFloat(pieToken.balance);
                        const calculatedBalance = rawBalance / Math.pow(10, decimals);
                        setUserPieBalance(calculatedBalance);
                    } else {
                        setUserPieBalance(0);
                    }
                }
            }
        } catch (e) { 
            console.error("TonAPI Fetch Error:", e); 
        }

        // 2. BACKEND (Envanter, Geçmiş, vb.)
        try {
            const apiData = await apiCall(`/user/${userFriendlyAddress}`);
            setUserInventory(apiData.inventory || []);
            setTransactionHistory(apiData.transactions || []);
            // Backend'den de bakiye gelebilir ama TONAPI daha günceldir, o yüzden üstüne yazmıyoruz.
        } catch (e) {
            console.error("User data fetch failed", e);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [userFriendlyAddress, activeTab]);

    const fetchMarketplace = async () => {
        try {
            const data = await apiCall(`/marketplace/${userFriendlyAddress || 'guest'}`);
            let list = data;
            if(marketplaceSearch) {
                list = list.filter(item => item.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || item.item_number.toString().includes(marketplaceSearch));
            }
            list.sort((a, b) => {
                if (currentSort === 'Price: Ascending') return a.price - b.price;
                if (currentSort === 'Price: Descending') return b.price - a.price;
                if (currentSort === 'Number: Ascending') return a.item_number - b.item_number; 
                if (currentSort === 'Number: Descending') return b.item_number - a.item_number; 
                return 0;
            });
            setMarketplaceListings(list);
        } catch (e) { console.error("Marketplace fetch error", e); }
    };

    useEffect(() => {
        fetchMarketplace();
    }, [currentSort, marketplaceSearch]);

    // --- ACTIONS ---
    const handlePackPurchase = async () => {
        if (!userFriendlyAddress) { showToast("Connect Wallet First!", "error"); return; }
        
        const amountTON = PACK_PRICE; 
        const amountNano = Math.floor(amountTON * 1000000000).toString(); 

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, 
            messages: [
                {
                    address: ADMIN_WALLET_ADDRESS, 
                    amount: amountNano,
                }
            ]
        };

        try {
            showToast("Confirm transaction...", "success");
            await tonConnectUI.sendTransaction(transaction);
            showToast("Verifying payment...", "success");
            
            const isConfirmed = await waitForTransaction(userFriendlyAddress, amountTON);

            if (isConfirmed) {
                showToast(`SUCCESS! Pack Opened!`, 'success');
                setPacksSold(prev => prev + 1);
                
                // --- YENİ EKLENEN KISIM: BACKEND'E MINT İSTEĞİ ---
                try {
                    const newItemNumber = packsSold + 1;
                    const mintRes = await apiCall('/mint', 'POST', {
                        owner_address: userFriendlyAddress,
                        name: "Plush Bluppie",
                        item_number: newItemNumber,
                        image_url: BLUPPIE_NFT_URL
                    });

                    // Backend'den dönen ID ile state güncelle
                    if (mintRes && mintRes.status === 'success') {
                         fetchAllData();
                    }
                } catch (mintError) {
                    console.error("Mint db save error:", mintError);
                    showToast("NFT bought but DB sync failed. Refresh page.", "error");
                }
                
                setShowNewPackModal(false);
            } else {
                showToast("Payment verification timed out.", "error");
            }
        } catch (e) {
            console.error(e);
            showToast('Transaction cancelled.', 'error');
        }
    };

    const currentUSDValue = (userPieBalance * PIE_USD_PRICE).toFixed(2);
    const formattedPieBalance = userPieBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const displayAddress = userFriendlyAddress 
        ? userFriendlyAddress.slice(0, 4) + '...' + userFriendlyAddress.slice(-4) 
        : 'Connect Wallet';

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleCloseFullPageViews = () => {
        setShowInventoryPage(false); 
        setShowListingPage(false); 
        setShowInventoryDetail(false);
        setShowStakingPage(false); 
        setShowTransactionHistoryPage(false);
        setShowLeaderboardPage(false);
        setShowDaoPage(false);
    };
    
    const handleNavClick = (tab) => {
        handleCloseFullPageViews();
        setShowBuyModal(false); 
        setActiveTab(tab);
    };

    const handleFinalizeListing = async (listedNftId, listPrice, currency) => {
        try {
            const res = await apiCall('/marketplace/list', 'POST', {
                nft_id: listedNftId,
                price: parseFloat(listPrice),
                currency: currency
            });
            if(res.status === 'success') {
                showToast(`SUCCESS: Listed for ${listPrice} ${currency}.`, 'success');
                fetchAllData();
                handleCloseFullPageViews();
            }
        } catch(e) { showToast("Listing Failed", "error"); }
    };

    const handleDeList = async (nftId) => {
        try {
            const res = await apiCall(`/marketplace/delist/${nftId}`, 'POST');
            if(res.status === 'success') {
                showToast(`Item #${nftId} delisted.`, 'success');
                fetchAllData();
            }
        } catch(e) { showToast("Delist Failed", "error"); }
    };
    
    const handlePurchase = async (nftId, price, currency) => {
        if (!userFriendlyAddress) { showToast("Connect Wallet First!", "error"); return; }
        try {
            const res = await apiCall('/marketplace/buy', 'POST', {
                nft_id: nftId,
                buyer_address: userFriendlyAddress
            });
            if(res.status === 'success') {
                showToast(`Acquired NFT!`, 'success');
                fetchAllData(); 
                fetchMarketplace(); 
                setShowBuyModal(false); 
            }
        } catch (e) {
            showToast('Transaction Failed or Insufficient Funds', 'error');
        }
    };

    const renderContent = () => {
        if (showInventoryPage) return <InventoryPage handleBack={handleCloseFullPageViews} openDetails={(nft)=>{setSelectedInventoryNft(nft); setShowInventoryDetail(true);}} inventory={userInventory} isShowingListings={isInventoryShowingListings} toggleView={setIsInventoryShowingListings} />;
        if (showListingPage) return <ListingPage handleBack={handleCloseFullPageViews} inventory={userInventory.filter(nft => nft.status === 'Owned')} showToast={showToast} finalizeListing={handleFinalizeListing} />;
        if (showStakingPage) return <StakingPage handleBack={handleCloseFullPageViews} pieBalance={formattedPieBalance} showToast={showToast} />;
        if (showTransactionHistoryPage) return <TransactionHistoryPage handleBack={handleCloseFullPageViews} history={transactionHistory} />;
        if (showLeaderboardPage) return <LeaderboardPage handleBack={handleCloseFullPageViews} />;
        if (showDaoPage) return <DaoPage handleBack={handleCloseFullPageViews} showToast={showToast} userAddress={userFriendlyAddress} />;
        
        if (activeTab === 'Menu') {
            return (
                <React.Fragment>
                    <div className="holo-panel pulse-glow">
                        <div className="balance-display">
                            <div className="balance-usd">
                                ${currentUSDValue} 
                                <button onClick={() => setShowBalanceTooltip(true)} style={{background:'none', border:'none', color: 'var(--color-text-secondary)', marginLeft: 8, cursor:'pointer'}}><Icons.Info /></button>
                            </div>
                            <div className="balance-pie">{formattedPieBalance} $PIE</div>
                        </div>
                        <div className="action-buttons">
                            <button className="action-btn" onClick={() => setShowStakingPage(true)}>STAKE</button>
                            <button className="action-btn" onClick={() => setShowSocialsModal(true)}>SOCIAL</button>
                        </div>
                        <button className="cta-btn" onClick={() => setShowGetPieModal(true)}>BUY $PIE</button>
                    </div>
                    
                    <div className="holo-panel">
                        <div className="nft-title" style={{justifyContent:'center', color: 'var(--color-text-primary)'}}><span className="text-neon"></span> New Packages & Pre-Sale</div> 
                        <div className="nft-scroll">
                            <div className="nft-card" onClick={() => setShowNewPackModal(true)} style={{ minWidth: '280px' }}>
                                <div style={{ padding: '15px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Plush Bluppie</div>
                                    <img className="nft-image" src={BLUPPIE_NFT_URL} />
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
            const currentBalanceAmount = currentCurrency === 'TON' ? userTonBalance : userPieBalance;
            const displayedBalance = currentBalanceAmount.toFixed(2) + ' ' + currentCurrency;
            return (
                <div className="marketplace-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}> <span className="text-neon">Marketplace</span></h2>
                        <button className="action-btn" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => setShowFilterModal(true)}>
                            {displayedBalance} ▼
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
                        {marketplaceListings.map((item) => {
                            const itemPrice = currentCurrency === 'TON' ? item.price : (item.price * TON_USD_PRICE / PIE_USD_PRICE).toFixed(4);
                            return (
                            <div key={item.id} className="marketplace-card" onClick={() => {setSelectedNFTToBuy(item); setShowBuyModal(true);}}>
                                <div className="card-image-wrapper"><img src={item.image_url || BLUPPIE_NFT_URL} className="card-image"/></div>
                                <div style={{ padding: '10px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{item.name} <span className="text-neon">#{item.item_number}</span></div>
                                    <div className="card-price-tag">{parseFloat(itemPrice).toLocaleString('en-US', {maximumFractionDigits: 2})} {currentCurrency}</div>
                                </div>
                            </div>
                        )})}
                    </div>
                    {marketplaceListings.length === 0 && <div className="text-dim" style={{textAlign:'center', marginTop: 20}}>NO MATCHES FOUND</div>}
                </div>
            );
        } else if (activeTab === 'Profile') {
            const badge = getHolderBadge(userPieBalance); 

            return (
                <React.Fragment>
                    <div className="holo-panel pulse-glow">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <img 
                                src={telegramUser?.photo_url || BLUPPIE_NFT_URL} 
                                style={{ width: '64px', height: '64px', borderRadius: '50%', border: `2px solid ${badge.color}`, padding: 2, boxShadow: badge.glow }} 
                            />
                            <div style={{ marginLeft: '15px' }}>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)', display:'flex', alignItems:'center', gap: 5 }}>
                                    {telegramUser ? (telegramUser.first_name) : 'Guest'} 
                                    <span style={{fontSize: 14}}>{badge.icon}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: badge.color, fontWeight: 'bold', letterSpacing: 1 }}>
                                    {badge.title} LEVEL
                                </div>
                                <div style={{ fontSize: '12px', color: !userFriendlyAddress ? 'var(--neon-red)' : 'var(--neon-green)', fontFamily: 'monospace', marginTop: 4 }}>
                                    {userFriendlyAddress ? displayAddress : 'Wallet Not Connected'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                             <TonConnectButton />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: 'var(--color-text-primary)', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setShowLeaderboardPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}>🏆 Leaderboard</span> 
                                <Icons.ArrowRight />
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: 'var(--color-text-primary)', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setShowDaoPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}>🗳️ Governance (DAO)</span> 
                                <Icons.ArrowRight />
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: 'var(--color-text-primary)', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setShowInventoryPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Market /> Inventory</span> 
                                <Icons.ArrowRight />
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: 'var(--color-text-primary)', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none', borderBottom:'1px solid var(--color-glass-border)' }} onClick={() => setShowStakingPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.Stake /> Staking</span> 
                                <Icons.ArrowRight />
                            </button>
                            <button className="menu-item-button" style={{ width: '100%', background: 'transparent', color: 'var(--color-text-primary)', padding: '15px 0', display: 'flex', justifyContent: 'space-between', cursor:'pointer', border:'none' }} onClick={() => setShowTransactionHistoryPage(true)}>
                                <span style={{display:'flex', alignItems:'center', gap:10}}><Icons.History /> Transaction History</span> 
                                <Icons.ArrowRight />
                            </button>
                        </div>
                    </div>

                    <div className="holo-panel"> 
                        <div className="nft-title" style={{fontSize: 18, color: 'var(--color-text-primary)'}}><Icons.Friends /> Referrals</div>
                        
                        <div style={{display: 'flex', gap: 10, marginBottom: 15}}>
                            <div style={{flex: 1, background: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 12, textAlign:'center'}}>
                                <div className="text-dim" style={{fontSize: 10}}>FRIENDS</div>
                                <div className="text-neon" style={{fontSize: 18, fontWeight: 'bold'}}>3</div>
                            </div>
                            <div style={{flex: 1, background: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 12, textAlign:'center'}}>
                                <div className="text-dim" style={{fontSize: 10}}>EARNED</div>
                                <div className="text-green" style={{fontSize: 18, fontWeight: 'bold'}}>150 PIE</div>
                            </div>
                        </div>

                        <div style={{marginBottom: 15, fontSize: 12, color: 'var(--color-text-secondary)'}}>
                            Invite friends and earn <span className="text-neon">%10</span> of their mints!
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="cta-btn secondary" style={{flex: 1, fontSize: 14, padding: 10}} onClick={() => showToast('Rewards Claimed!', 'success')}>CLAIM</button>
                            <button className="cta-btn" style={{flex: 1, fontSize: 14, padding: 10}} onClick={async () => { await navigator.clipboard.writeText(`https://t.me/BluppieBot?start=${userFriendlyAddress}`); showToast('LINK COPIED', 'success'); }}>INVITE</button>
                        </div>
                    </div>
                </React.Fragment>
            );
        }
    };

    return (
        <div className="container">
            {renderContent()}
            <Toast show={toast.show} message={toast.message} type={toast.type} />
            <BuyModal 
                show={showBuyModal} 
                onClose={() => setShowBuyModal(false)} 
                nft={selectedNFTToBuy} 
                currentCurrency={currentCurrency} 
                showToast={showToast} 
                handlePurchase={handlePurchase}
                tonBalance={userTonBalance}
                pieBalance={userPieBalance}
            />
            <NewPackModal 
                show={showNewPackModal} 
                onClose={() => setShowNewPackModal(false)} 
                showToast={showToast} 
                handlePackPurchase={handlePackPurchase} 
                packsSold={packsSold} 
                userBalance={userTonBalance}
            />
            <InventoryDetailModal show={showInventoryDetail} onClose={() => setShowInventoryDetail(false)} nft={selectedInventoryNft} showToast={showToast} isListed={selectedInventoryNft && selectedInventoryNft.status === 'Listed'} deList={handleDeList} />
            <BalanceTooltipModal show={showBalanceTooltip} onClose={() => setShowBalanceTooltip(false)} usd={currentUSDValue} pie={formattedPieBalance} price={PIE_USD_PRICE} />

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

            <nav className="bottom-nav" style={{
                position: 'fixed',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                maxWidth: 400,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div className={`nav-item ${activeTab === 'Menu' ? 'active' : ''}`} onClick={() => handleNavClick('Menu')} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <Icons.Menu /><span style={{marginTop:4}}>Home</span>
                </div>
                <div className={`nav-item ${activeTab === 'Marketplace' ? 'active' : ''}`} onClick={() => handleNavClick('Marketplace')} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <Icons.Market /><span style={{marginTop:4}}>Marketplace</span>
                </div>
                <div className={`nav-item ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => handleNavClick('Profile')} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <Icons.Profile /><span style={{marginTop:4}}>Profile</span>
                </div>
            </nav>
        </div>
    );
}

export default App;
