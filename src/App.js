// src/App.js
/*
  Monafuku Cafe — Cute Wallet Whitelist Checker + Shareable Result Card
  - per-device recent wallets (localStorage)
  - result card modal with random Monafuku art + tier + kaomoji
  - demo gacha for non-whitelisted users
  - share to X (no wallet)
  - download card as PNG via html2canvas
  - music with "Enter Cafe" interaction
*/

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import "./index.css";

/* ------------------- CONFIG ------------------- */

// replace these with your real public paths under public/art/
const ART_CARD_IMAGES = [
  "/art/monafuku-1.jpg",
  "/art/monafuku-2.jpg",
  "/art/monafuku-3.jpg",
  "/art/monafuku-4.jpg",
  "/art/monafuku-5.jpg",
];

// small gallery/header image (first one used)
const ART_IMAGE_URL = ART_CARD_IMAGES[0];

// local audio path (place your mp3 at public/audio/monafuku-theme.mp3)
const MUSIC_URL = "/audio/monafuku-theme.mp3";

// your live site URL (used only in share links)
const SITE_URL = "https://monafuku-checker.vercel.app";

// demo whitelist map: address -> tier (lowercase addresses)
const WHITELIST_MAP = {
  "0x3bbe2c84f6911aa1ab89b7b71979e76eb1b3863c": "freemint_plus",
  // add more addresses here in lowercase as needed:
  // "0xabc...": "wl",
  // "0xdef...": "public",
};

const TIER_LABELS = {
  freemint_plus: "FreeMint",
  wl: "WL (discount)",
  public: "Public",
};

/* ------------------- APP ------------------- */

export default function App() {
  // main states
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [error, setError] = useState(null);

  // recent wallets per-device (persist to localStorage)
  const [savedWallets, setSavedWallets] = useState(() => {
    try {
      const s = window.localStorage.getItem("mf_recent_wallets");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "mf_recent_wallets",
        JSON.stringify(savedWallets)
      );
    } catch (e) {
      // ignore
    }
  }, [savedWallets]);

  // search + UI
  const [hasSearched, setHasSearched] = useState(false);

  // audio / cafe intro
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [showIntro, setShowIntro] = useState(true);

  // result card modal state
  const [resultCard, setResultCard] = useState(null);

  // make html2canvas available for the download handler
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.html2canvas = html2canvas;
    }
  }, []);

  /* ------------------- AUDIO CONTROLS ------------------- */

  const toggleMusic = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Failed to toggle music", err);
    }
  };

  const handleEnterCafe = async () => {
    try {
      if (audioRef.current && !isPlaying) {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      // some browsers still block, that's ok — user can press play
      console.log("Could not auto-play on enter:", err);
    }
    setShowIntro(false);
  };

  /* ------------------- WHITELIST CHECK (local demo) ------------------- */

  async function fetchNFTs(owner) {
    setError(null);
    setLoading(true);
    setNfts([]);
    setResultCard(null);

    try {
      const addr = owner.trim().toLowerCase();

      // Determine tier from WHITELIST_MAP if available
      const tier = WHITELIST_MAP[addr] || null;
      const isWhitelisted = tier !== null;

      // Demo gacha chance for non-whitelisted users (client-side demo only)
      const demoGachaChance = 0.03; // 3% demo chance
      const gachaIsWinner = !isWhitelisted && Math.random() < demoGachaChance;

      // build cute result card data
      const randomImg =
        ART_CARD_IMAGES[Math.floor(Math.random() * ART_CARD_IMAGES.length)];
      const kaomojis = ["(◕‿◕)", "(≧◡≦)", "(^_−)☆", "☆*:.｡.o(≧▽≦)o.｡.:*☆"];
      const chosenKaomoji = kaomojis[Math.floor(Math.random() * kaomojis.length)];

      const card = {
        status: isWhitelisted ? "whitelisted" : "not_whitelisted",
        tier: isWhitelisted ? tier : null,
        image: randomImg,
        message: isWhitelisted ? `You have a registered spot/table in the cafe ${chosenKaomoji}` : `Don't worry!

 Gacha going on! Check Monafuku mint page on Nov. 24 to maybe win WL/Free Mint! 🍀`,
        gacha: !isWhitelisted
          ? {
              isWinner: gachaIsWinner,
              note: gachaIsWinner
                ? "Lucky! You may have a surprise on mint day — come check!"
                : "Gacha running on mint day: some lucky wallets will get a spot. Come back!",
            }
          : null,
      };

      // For UI, set a fake NFT object if whitelisted so old UI remains compatible
      if (isWhitelisted) {
        setNfts([
          {
            tokenId: 1,
            name: "Monafuku Cafe Whitelist",
            image: card.image,
            traits: [{ trait_type: "Status", value: "Whitelisted" }],
          },
        ]);
      } else {
        setNfts([]);
      }

      // show card
      setResultCard(card);
    } catch (e) {
      console.error(e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------- FORM HANDLERS ------------------- */

  const onCheck = async (e) => {
    e.preventDefault();
    setError(null);
    const addr = wallet.trim();
    if (!addr) return setError("Please enter a wallet address.");
    setHasSearched(true);

    // Try starting audio here as user gesture fallback if not already playing
    try {
      if (audioRef.current && !isPlaying) {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }

    fetchNFTs(addr);

    // save locally (per-device)
    setSavedWallets((prev) => {
      const normalized = addr;
      if (!normalized) return prev;
      if (prev.includes(normalized)) return prev;
      return [normalized, ...prev].slice(0, 20);
    });
  };

  const handleView = () => {
    if (!wallet) return;
    alert("This wallet is whitelisted for the Monafuku Cafe mint! 🍰");
  };

   const handleShare = () => {
  // Exact local path we created above — your deploy will transform this to a public URL
  const sharePage = "/share/card.html";

  const text = encodeURIComponent(
    resultCard?.status === "whitelisted"
      ? "I just checked the Monafuku Cafe whitelist — I’m whitelisted! 🍰✨"
      : "I just checked the Monafuku Cafe whitelist — not yet, but there will be gacha on mint day! 🍀"
  );

  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(sharePage)}`,
    "_blank",
    "noopener,noreferrer"
  );
};



  /* ------------------- CARD DOWNLOAD ------------------- */

  const downloadCardAsImage = async () => {
    const node = document.querySelector(".result-card-content");
    if (!node) {
      alert("Result card not found to download.");
      return;
    }
    try {
      const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "monafuku-whitelist.png";
      a.click();
    } catch (err) {
      console.error("Failed to capture card:", err);
      alert("Failed to download the card. Try using the browser screenshot tool.");
    }
  };

  /* ------------------- RENDER ------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 p-6">
      {/* Intro overlay to start music as a user gesture */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl border border-pink-100">
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl overflow-hidden bg-pink-50 flex items-center justify-center">
              <span className="text-4xl">🍰</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Welcome to Monafuku Cafe</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the cafe to check your whitelist status and enjoy some comfy music.
            </p>
            <button
              onClick={handleEnterCafe}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-semibold shadow hover:scale-105 transform transition"
            >
              Enter Cafe
            </button>
            <p className="mt-3 text-[11px] text-gray-400">
              Music may not autoplay on some browsers until you interact. 💿
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <audio ref={audioRef} src={MUSIC_URL} loop className="hidden" />

        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-300 to-purple-300 shadow-xl flex items-center justify-center">
              <span className="text-3xl">🍰</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Monafuku Cafe — Wallet Checker
              </h1>
              <p className="text-sm text-gray-600">
                Check if your wallet is whitelisted for the Monafuku Cafe mint. Cute vibes only ✧
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <img src={ART_IMAGE_URL} alt="Monafuku art" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
            </div>
            <button
              type="button"
              onClick={toggleMusic}
              className="px-3 py-2 rounded-full bg-white/70 border border-pink-200 text-xs font-medium shadow-sm hover:bg-pink-50"
            >
              {isPlaying ? "Pause cafe music ♫" : "Play cafe music ♫"}
            </button>
          </div>
        </header>

        {/* Main Card */}
        <main className="bg-white/70 rounded-2xl p-6 shadow-md">
          <form onSubmit={onCheck} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Wallet address</label>
              <div className="mt-2 flex flex-col md:flex-row gap-3 items-stretch">
                <input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="Paste Monad or EVM wallet address..."
                  className="flex-1 p-3 rounded-xl border border-pink-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold shadow hover:scale-105 transform transition"
                >
                  {loading ? "Checking..." : "Check Wallet"}
                </button>
              </div>
            </div>
          </form>

          {/* Recently checked wallets (per-device) */}
          {savedWallets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recently checked wallets</h3>
              <div className="flex flex-wrap gap-2">
                {savedWallets.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setWallet(w);
                      fetchNFTs(w);
                    }}
                    className="px-3 py-1 rounded-full bg-white border border-pink-200 text-xs font-medium hover:bg-pink-50"
                  >
                    {w.slice(0, 6)}...{w.slice(-4)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results / placeholder */}
          <section className="mt-6">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}

            {!error && !loading && nfts.length === 0 && !resultCard && (
              <div className="text-center py-12 text-gray-500">
                {hasSearched
                  ? "This wallet does not currently have a Monafuku Cafe whitelist."
                  : "No wallets checked yet — paste your address above to see if you are whitelisted."}
              </div>
            )}

            {nfts.length > 0 && (
              <div>
                {hasSearched && !loading && !error && (
                  <div className="mb-6 flex justify-center">
                    <div className="inline-block px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm text-center shadow-sm">
                      This wallet has a Monafuku Cafe whitelist spot ✨
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Whitelist status</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {nfts.map((nft) => (
                    <motion.article
                      key={`${nft.tokenId}-${nft.name}`}
                      className="bg-white rounded-2xl p-3 shadow-md border border-pink-50"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-pink-50 flex items-center justify-center">
                        {nft.image ? (
                          <img src={nft.image} alt={nft.name || `#${nft.tokenId}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-3xl">🍥</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold truncate">{nft.name || `Token #${nft.tokenId}`}</h3>
                          <span className="text-xs text-gray-500">#{nft.tokenId}</span>
                        </div>

                        {nft.traits && nft.traits.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                            {nft.traits.slice(0, 4).map((t, i) => (
                              <div key={i} className="bg-pink-50 px-2 py-1 rounded-full text-center">
                                {t.trait_type}: {t.value}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button className="flex-1 py-2 rounded-xl border border-purple-100 text-sm" onClick={handleView}>View</button>
                          <button className="py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-200 to-pink-200 text-sm" onClick={handleShare}>Share</button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="mt-6 text-center text-gray-600">Loading... please wait ✨</div>}
          </section>
        </main>

        {/* Gallery */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 text-center">Monafuku Cafe gallery</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {ART_CARD_IMAGES.map((src, idx) => (
              <div key={idx} className="flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100">
                <img src={src} alt={`Monafuku art ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-6 text-center text-gray-500 text-sm">Built with ☕ and lots of cuteness. Want a custom color theme or extra cafe vibes? ✧</footer>
      </div>

      {/* Result card modal */}
      {resultCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <button aria-label="Close result modal" onClick={() => setResultCard(null)} className="absolute top-3 right-3 z-50 bg-white border rounded-full p-2 shadow hover:scale-105 focus:outline-none" style={{ zIndex: 9999 }}>✕</button>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="p-6">
                <img src={resultCard.image} alt="Monafuku" className="w-full h-64 object-cover rounded-xl" />
              </div>
              <div className="p-6 result-card-content">
                <h3 className="text-2xl font-bold mb-2">
                  {resultCard.status === "whitelisted" ? "You are Whitelisted ✨" : "You are not whitelisted"}
                </h3>

                

                <p className="text-gray-700 mt-3 whitespace-pre-line">{resultCard.message}</p>
{!resultCard.tier && (
  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 font-medium text-sm">
    Alpha: Share on X for increased chance of winning!
  </div>
)}

                {resultCard.gacha && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-yellow-800">
                    {resultCard.gacha.isWinner ? (
                      <div><strong>Gacha surprise!</strong> {resultCard.gacha.note}</div>
                    ) : (
                      <div><strong>Gacha info:</strong> {resultCard.gacha.note}</div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(
                        resultCard.status === "whitelisted"
                          ? "I just checked the Monafuku Cafe whitelist — I’m whitelisted! 🍰✨"
                          : "I just checked the Monafuku Cafe whitelist — not yet, but there will be gacha on mint day! 🍀"
                      );
                      const url = encodeURIComponent(SITE_URL);
                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white"
                  >
                    Share on X
                  </button>

                  <button onClick={downloadCardAsImage} className="px-4 py-2 rounded-lg bg-white border">Download card (PNG)</button>

                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


