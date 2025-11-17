/*
  Monafuku Cafe — Cute Wallet Whitelist Checker
  - Local whitelist (no RPC / no backend)
  - Cute Monafuku art in header + gallery
  - Cafe music with intro overlay
  - Share whitelist status on X/Twitter (no wallet address shown)
*/

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import "./index.css";

// --- Assets config ---
// Make sure these files exist in: public/art and public/audio
// Example:
// public/art/monafuku-1.jpg ... monafuku-5.jpg
// public/audio/monafuku-theme.mp3

const ART_IMAGES = [
  "/art/monafuku-1.jpg",
  "/art/monafuku-2.jpg",
  "/art/monafuku-3.jpg",
  "/art/monafuku-4.jpg",
  "/art/monafuku-5.jpg",
];

const ART_IMAGE_URL = ART_IMAGES[0];
const MUSIC_URL = "/audio/monafuku-theme.mp3"; // your local Nippon Egao Hyakkei mp3
const SITE_URL = "https://monafuku-checker.vercel.app/"; // change to deployed URL later

// Local whitelist: store all addresses in lowercase here
const WHITELIST = [
  "0x3bbe2c84f6911aa1ab89b7b71979e76eb1b3863c", // add more wallets here (lowercase)
];

export default function App() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [error, setError] = useState(null);
  const [savedWallets, setSavedWallets] = useState([
    "0x3bBe2C84F6911AA1ab89B7b71979e76eb1B3863c",
  ]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const audioRef = useRef(null);

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
      console.log("Could not auto-play music on enter:", err);
    }
    setShowIntro(false);
  };

  async function fetchNFTs(owner) {
    setError(null);
    setLoading(true);
    setNfts([]);
    try {
      const addr = owner.trim().toLowerCase();
      const isWhitelisted = WHITELIST.includes(addr);

      if (isWhitelisted) {
        // Fake one "NFT" object so the UI can stay cute
        setNfts([
          {
            tokenId: 1,
            name: "Monafuku Cafe Whitelist",
            image: null,
            traits: [{ trait_type: "Status", value: "Whitelisted" }],
          },
        ]);
      } else {
        setNfts([]);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function onCheck(e) {
    e.preventDefault();
    const addr = wallet.trim();
    if (!addr) return setError("Please enter a wallet address.");
    setHasSearched(true);
    fetchNFTs(addr);
    setSavedWallets((prev) => {
      if (!addr || prev.includes(addr)) return prev;
      return [addr, ...prev].slice(0, 20);
    });
  }

  const handleView = () => {
    if (!wallet) return;
    alert("This wallet is whitelisted for the Monafuku Cafe mint! 🍰");
  };

  const handleShare = () => {
    if (!wallet) return;
    if (typeof window === "undefined") return;

    const text = encodeURIComponent(
      "I just checked on the Monafuku Cafe whitelist checker and I'm whitelisted! 🍰✨"
    );
    const url = encodeURIComponent(SITE_URL);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 p-6">
      {/* Intro / Enter Cafe Overlay */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl border border-pink-100">
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl overflow-hidden bg-pink-50 flex items-center justify-center">
              <span className="text-4xl">🍰</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Welcome to Monafuku Cafe</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the cafe to check your whitelist status and enjoy some comfy
              music.
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

        {/* HEADER */}
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
                Check if your wallet is whitelisted for the Monafuku Cafe mint.
                Cute vibes only ✧
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <img
                src={ART_IMAGE_URL}
                alt="Monafuku art"
                className="w-16 h-16 rounded-2xl object-cover shadow-md"
              />
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

        {/* MAIN CARD */}
        <main className="bg-white/70 rounded-2xl p-6 shadow-md">
          {/* Wallet input */}
          <form onSubmit={onCheck} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Wallet address
              </label>
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

          {/* Recently checked wallets */}
          {savedWallets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Recently checked wallets
              </h3>
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

          {/* Results section */}
          <section className="mt-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700">
                {error}
              </div>
            )}

            {!error && !loading && nfts.length === 0 && (
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
                          <img
                            src={nft.image}
                            alt={nft.name || `#${nft.tokenId}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-3xl">🍥</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold truncate">
                            {nft.name || `Token #${nft.tokenId}`}
                          </h3>
                          <span className="text-xs text-gray-500">
                            #{nft.tokenId}
                          </span>
                        </div>

                        {nft.traits && nft.traits.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                            {nft.traits.slice(0, 4).map((t, i) => (
                              <div
                                key={i}
                                className="bg-pink-50 px-2 py-1 rounded-full text-center"
                              >
                                {t.trait_type}: {t.value}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button
                            className="flex-1 py-2 rounded-xl border border-purple-100 text-sm"
                            onClick={handleView}
                          >
                            View
                          </button>
                          <button
                            className="py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-200 to-pink-200 text-sm"
                            onClick={handleShare}
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-6 text-center text-gray-600">
                Loading... please wait ✨
              </div>
            )}
          </section>
        </main>

        {/* Gallery */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 text-center">
            Monafuku Cafe gallery
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {ART_IMAGES.map((src, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100"
              >
                <img
                  src={src}
                  alt={`Monafuku art ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-6 text-center text-gray-500 text-sm">
          Built with ☕ and lots of cuteness ✧
        </footer>
      </div>
    </div>
  );
}
