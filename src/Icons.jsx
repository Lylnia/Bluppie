import React from 'react';

export const Icons = {
    // Daha yumuşak, yuvarlak dönüşlü Geri Ok
    Back: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
        </svg>
    ),
    // "Home" sekmesi için Hamburger menü yerine "Ev" ikonu (Daha mantıklı ve sevimli)
    Menu: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8c0 1.1.9 2 2 2h3z" style={{strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 0}}/>
        </svg>
    ),
    // Daha yuvarlak hatlı Mağaza
    Market: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
        </svg>
    ),
    // Yuvarlak kafa ve vücut hatlı Profil
    Profile: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
    ),
    // Yuvarlak Info
    Info: () => (
        <svg className="icon-svg" style={{width:18, height:18}} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
    ),
    // Kalın ve yuvarlak Çarpı
    Close: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7a.996.996 0 1 0-1.41 1.41L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
        </svg>
    ),
    // Kalın ve yuvarlak Onay İşareti
    Check: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
    ),
    // Yuvarlak Saat
    History: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
    ),
    Sort: () => (
        <svg className="icon-svg" style={{width:18, height:18}} viewBox="0 0 24 24">
            <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
        </svg>
    ),
    Filter: () => (
        <svg className="icon-svg" style={{width:18, height:18}} viewBox="0 0 24 24">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
        </svg>
    ),
    // Staking için "Elmas/Mücevher" ikonu (Bluppie temasına daha uygun)
    Stake: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12l-5-5h10l-5 5z"/>
        </svg>
    ),
    // Daha yuvarlak hatlı Arkadaş Grubu
    Friends: () => (
        <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
    )
};
