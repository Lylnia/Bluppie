import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import './index.css';
import WebApp from '@twa-dev/sdk';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

// --- API AYARLARI ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
}

// --- SABİTLER ---
// Senin PIE Token Kontratın
const PIE_TOKEN_CONTRACT = "EQDgIHYB656hYyTJKh0bdO2ABNAcLXa45wIhJrApgJE8Nhxk"; 

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
const PACK_PRICE = 3.00; 

const PIE_USD_PRICE = 0.0000013; 
const TON_USD_PRICE = 1.50;      

const LINK_BLUM_SWAP = "https://t.me/blum/app?startapp=memepadjetton_PIE_57LxQ-ref_RTUbazVEYx";
const LINK_GAME = "https://t.me/BluppieBot"; 
const SOCIAL_TWITTER = "https://twitter.com/BluppieNFT";
const SOCIAL_TELEGRAM = "https://t.me/BluppieNFT";
const SOCIAL_DISCORD = "https://discord.gg/";

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
                <div style={{ fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-head)', fontSize: '18px' }}>
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
                <div style={{ fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-head)' }}>
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

                <div style={{ padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>Buyer Pays:</span>
                        <span className="text-neon">{buyerPays.toLocaleString('en-US', {maximumFractionDigits: 4})} {listingCurrency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>Fee:</span>
                        <span style={{ color: 'var(--neon-red)' }}>- {commissionAmount.toLocaleString('en-US', {maximumFractionDigits: 4})} {listingCurrency}</span>
                    </div>
                    <hr style={{ borderColor: 'var(--color-glass-border)', margin: '10px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontFamily: 'var(--font-head)' }}>
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
                    <h3 className="modal-title" style={{fontSize: 22, color: 'var(--neon-cyan)'}}>{nft.name} <span style={{color:'#fff'}}>#{nft.item_number}</span></h3>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', letterSpacing: '1px' }}>// NFT DETAILS</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px', border: '1px solid var(--neon-purple)', borderRadius: '16px', padding: '4px', boxShadow: '0 0 15px rgba(188,19,254,0.1)' }}>
                    <img src={nft.image_url || BLUPPIE_NFT_URL} style={{ width: '100%', height: '180px', objectFit: 'contain', borderRadius: '12px' }} />
                </div>

                {isListed && (
                    <div className="holo-panel" style={{ padding: '15px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neon-cyan)' }}>
                            <span>PRICE:</span>
                            <span style={{fontFamily: 'var(--font-head)', fontSize: 18}}>{nft.price} {nft.currency || 'TON'}</span>
                        </div>
                    </div>
                )}
                
                {isListed && (
                    <button className="cta-btn" onClick={() => { deList(nft.id); onClose(); }} style={{ background: 'rgba(255,0,85,0.2)', border: '1px solid #ff0055', color: '#ff0055', marginBottom: '15px' }}>
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
    const remaining = TOTAL_PACK_SUPPLY - packsSold; 
    const progressPercent = (packsSold / TOTAL_PACK_SUPPLY) * 100; 
    const canAfford = userBalance >= PACK_PRICE;

    const handlePurchase = () => {
        if (!canAfford) { showToast(`INSUFFICIENT CREDITS: ${PACK_PRICE.toFixed(2)} TON required.`, 'error'); return; }
        handlePackPurchase(); 
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', borderRadius: '24px', padding: '24px', border: '1px solid var(--neon-cyan)', boxShadow: '0 0 30px rgba(0,243,255,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', cursor:'pointer' }}><Icons.Close /></button>
                
                <div style={{ textAlign: 'center' }}>
                    <h2 className="text-neon" style={{fontSize: '24px', marginBottom: '5px'}}>Plush Bluppie Package</h2>
                    <div className="text-dim" style={{fontSize: '12px', letterSpacing: '2px', marginBottom: '20px'}}>LIMITED NFT</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: '0', background: 'radial-gradient(circle, rgba(0,243,255,0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
                    <img src={BLUPPIE_NFT_URL} style={{ width: '160px', height: '160px', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 10px rgba(0,243,255,0.5))' }} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        <span>MINT PROGRESS</span>
                        <span className="text-neon">{progressPercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#111', borderRadius: '3px', overflow: 'hidden', border: '1px solid #333' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--neon-cyan)', boxShadow: '0 0 10px var(--neon-cyan)' }} />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px', color: '#fff' }}>
                        {packsSold} / {TOTAL_PACK_SUPPLY} MINTED
                    </div>
                </div>

                <div className="holo-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{fontFamily: 'var(--font-head)', fontSize: '18px'}}>COST:</span>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-head)' }}>
                            <img src={TON_LOGO_URL} style={{ width: '24px', marginRight: '8px' }} />
                            {PACK_PRICE.toFixed(2)}
                    </div>
                </div>
                
                <button className="cta-btn" onClick={handlePurchase} disabled={!canAfford}>
                    {canAfford ? 'MINT' : 'INSUFFICIENT FUNDS'}
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
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff' }}><Icons.Close /></button>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div className="modal-title text-neon" style={{fontSize: 20}}>BUY NFT</div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <img src={nft.image_url || BLUPPIE_NFT_URL} style={{ width: '80px', height: '80px', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '18px', fontFamily: 'var(--font-head)', fontWeight: '700' }}>{nft.name}</div>
                        <div className="text-neon">#{nft.item_number}</div>
                    </div>
                </div>

                <div className="holo-panel" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                        <span className="text-dim">TOTAL COST:</span>
                        <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', color: '#fff' }}>
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
                <h3 className="modal-title" style={{fontSize: 18, marginBottom: 15, color: 'var(--neon-cyan)'}}>ASSET VALUATION</h3>
                <div style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-dim">Holding:</span> <span className="text-neon">{pie} PIE</span>
                </div>
                <div style={{ fontSize: '14px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-dim">Market Price:</span> <span>${price}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-glass-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontFamily: 'var(--font-head)', fontWeight: '700' }}>
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
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>Staking</h2>
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
                    AVAILABLE: <strong className="text-white">{pieBalance} $PIE</strong>
                </div>
                <input
                    type="number"
                    placeholder="Amount to Stake"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    style={{ marginBottom: '15px' }}
                />
                {amount > 0 && !isNaN(amount) && (
                    <div style={{ padding: '10px', background: 'rgba(0,255,157,0.1)', borderRadius: '8px', border: '1px solid var(--neon-green)', marginBottom: '15px', fontSize: '14px' }}>
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
                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)' }}><Icons.Back /></button>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, fontSize: '20px' }}>My Transactions</h2>
                <div style={{ width: 24 }}></div>
            </div>
            
            <div style={{ padding: '0 16px' }}>
                {history.map((tx) => (
                    <div key={tx.id} className="holo-panel" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <div style={{ fontWeight: '700', color: '#fff', fontFamily: 'var(--font-head)' }}>
                                <span style={{ color: tx.type.includes('Buy') ? 'var(--neon-red)' : 'var(--neon-green)' }}>{tx.type.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{tx.item_name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            {tx.amount !== 'N/A' && <div className="text-neon">{tx.amount} {tx.currency}</div>}
                            <div style={{ fontSize: '10px', opacity: 0.5 }}>{tx.status}</div>
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
    const walletAddress = userFriendlyAddress || "0xDisconnected"; 

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

    const [currentSort, setCurrentSort] = useState('Price: Ascending');
    const [currentCurrency, setCurrentCurrency] = useState('TON');
    const [marketplaceListings, setMarketplaceListings] = useState([]);
    const [marketplaceSearch, setMarketplaceSearch] = useState('');
    const [packsSold, setPacksSold] = useState(10);
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

    // --- DATA FETCHING (GÜNCELLENMİŞ TON CENTER V3) ---
    const fetchUserData = async () => {
        if (!userFriendlyAddress) return;

        // 1. GERÇEK TON BAKİYESİ
        try {
            const response = await fetch('https://toncenter.com/api/v2/jsonRPC', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "id": "1",
                    "jsonrpc": "2.0",
                    "method": "getAddressBalance",
                    "params": { "address": userFriendlyAddress }
                })
            });
            const data = await response.json();
            if (data.result) {
                const realTon = parseInt(data.result) / 1000000000;
                setUserTonBalance(realTon);
            }
        } catch (e) {
            console.error("TON Fetch Error:", e);
        }

        // 2. GERÇEK PIE TOKEN BAKİYESİ (TONCENTER V3 - ÜCRETSİZ)
        try {
            // Toncenter V3 Jetton Wallets Endpoint
            const jettonRes = await fetch(
                `https://toncenter.com/api/v3/jetton/wallets?owner_address=${userFriendlyAddress}&jetton_address=${PIE_TOKEN_CONTRACT}&limit=1&offset=0`
            );
            const jettonData = await jettonRes.json();

            if (jettonData && jettonData.items && jettonData.items.length > 0) {
                // Token bulundu, bakiyeyi al
                const item = jettonData.items[0];
                const decimals = parseInt(item.jetton.decimals) || 9;
                const rawBalance = parseFloat(item.balance);
                const formattedPie = rawBalance / Math.pow(10, decimals);
                setUserPieBalance(formattedPie);
            } else {
                // Token bulunamadıysa bakiye 0
                setUserPieBalance(0);
            }
        } catch (e) {
            console.error("PIE Token Fetch Error:", e);
        }

        // 3. ENVANTER VE GEÇMİŞ
        try {
            const apiData = await apiCall(`/user/${userFriendlyAddress}`);
            setUserInventory(apiData.inventory);
            setTransactionHistory(apiData.transactions);
        } catch (e) {
            if (userInventory.length === 0) {
                setUserInventory([
                    { id: 1, name: "Plush Bluppie", item_number: 1, image_url: BLUPPIE_NFT_URL, status: "Owned" },
                    { id: 2, name: "Plush Bluppie", item_number: 10, image_url: BLUPPIE_NFT_URL, status: "Owned" }
                ]);
            }
        }
    };

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
        fetchUserData();
        fetchMarketplace();
    }, [userFriendlyAddress, activeTab, currentSort, marketplaceSearch]);

    // --- ACTIONS ---
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
                fetchUserData();
                handleCloseFullPageViews();
            }
        } catch(e) { showToast("Listing Failed", "error"); }
    };

    const handleDeList = async (nftId) => {
        try {
            const res = await apiCall(`/marketplace/delist/${nftId}`, 'POST');
            if(res.status === 'success') {
                showToast(`Item #${nftId} delisted.`, 'success');
                fetchUserData();
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
                fetchUserData(); 
                fetchMarketplace(); 
                setShowBuyModal(false); 
            }
        } catch (e) {
            showToast('Transaction Failed or Insufficient Funds', 'error');
        }
    };
    
    const handlePackPurchase = async () => {
        if (!userFriendlyAddress) { showToast("Connect Wallet First!", "error"); return; }
        try {
            const res = await apiCall('/packs/buy', 'POST', {
                wallet_address: userFriendlyAddress
            });
            if(res.status === 'success') {
                showToast(`Pack Unlocked! NFT #${res.nft.item_number} added.`, 'success');
                setPacksSold(prev => prev + 1);
                fetchUserData();
                setShowNewPackModal(false);
            }
        } catch(e) {
            showToast('Purchase Failed or Insufficient Funds', 'error');
        }
    };

    const renderContent = () => {
        if (showInventoryPage) return <InventoryPage handleBack={handleCloseFullPageViews} openDetails={(nft)=>{setSelectedInventoryNft(nft); setShowInventoryDetail(true);}} inventory={userInventory} isShowingListings={isInventoryShowingListings} toggleView={setIsInventoryShowingListings} />;
        if (showListingPage) return <ListingPage handleBack={handleCloseFullPageViews} inventory={userInventory.filter(nft => nft.status === 'Owned')} showToast={showToast} finalizeListing={handleFinalizeListing} />;
        if (showStakingPage) return <StakingPage handleBack={handleCloseFullPageViews} pieBalance={formattedPieBalance} showToast={showToast} />;
        if (showTransactionHistoryPage) return <TransactionHistoryPage handleBack={handleCloseFullPageViews} history={transactionHistory} />;
        
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
                        <div className="nft-title" style={{justifyContent:'center'}}><span className="text-neon"></span> New Packages & Pre-Sale</div> 
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
                        <h2 style={{ fontSize: '22px' }}> <span className="text-neon">Marketplace</span></h2>
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
            return (
                <React.Fragment>
                    <div className="holo-panel">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <img 
                                src={telegramUser?.photo_url || BLUPPIE_NFT_URL} 
                                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--neon-cyan)', padding: 2 }} 
                            />
                            <div style={{ marginLeft: '15px' }}>
                                <div style={{ fontSize: '20px', fontWeight: '700' }}>
                                    {telegramUser ? (telegramUser.first_name + ' ' + (telegramUser.last_name || '')) : 'Guest User'}
                                </div>
                                <div style={{ fontSize: '12px', color: !userFriendlyAddress ? 'var(--neon-red)' : 'var(--neon-green)', fontFamily: 'monospace' }}>
                                    {userFriendlyAddress ? displayAddress : 'Wallet Not Connected'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                             <TonConnectButton />
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
                        {userFriendlyAddress && <button className="cta-btn" style={{background: 'transparent', border: '1px solid var(--neon-red)', color: 'var(--neon-red)'}} onClick={() => tonConnectUI.disconnect()}>DISCONNECT WALLET</button>}
                    </div>

                    <div className="holo-panel"> 
                        <div className="nft-title" style={{fontSize: 18}}><Icons.Friends /> Referrals</div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', justifyContent: 'space-between' }}>
                            <span className="text-dim">Total Invites</span>
                            <span className="text-neon" style={{ fontSize: '18px', fontWeight: '800' }}>0</span>
                        </div>
                        <button className="cta-btn" onClick={async () => { await navigator.clipboard.writeText(userFriendlyAddress); showToast('UPLINK COPIED', 'success'); }}>Invite Friends</button>
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
