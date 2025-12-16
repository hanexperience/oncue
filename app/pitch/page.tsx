"use client";

import React, { useState, useEffect } from 'react';
import styles from './PitchDeck.module.css';

const PitchDeck = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 12;

    // FIX 1: Added ": number" to tell TypeScript this is a number
    const changeSlide = (direction: number) => {
        let newSlide = currentSlide + direction;
        if (newSlide >= totalSlides) { newSlide = 0; }
        else if (newSlide < 0) { newSlide = totalSlides - 1; }
        setCurrentSlide(newSlide);
    };

    useEffect(() => {
        // FIX 2: Added ": KeyboardEvent" to tell TypeScript this is a key event
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                changeSlide(1);
            } else if (e.key === 'ArrowLeft') {
                changeSlide(-1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    // Helper to determine active slide class
    const getSlideClass = (index: number) => {
        return `${styles.slide} ${index === currentSlide ? styles.active : ''}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.atmosphere}></div>

            <div className={styles.presentationContainer}>

                {/* SLIDE 1: INTRO */}
                <div className={getSlideClass(0)}>
                    <div className={styles.fullCenter}>
                        <h3>The Operating System for the Synchronous Economy</h3>
                        <h1>ON CUE</h1>
                        <p style={{ maxWidth: '600px' }}>
                            The first dedicated marketplace for structured, performance-based live streaming experiences for brands and creators.
                        </p>
                        <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px', width: '50px' }}></div>
                    </div>
                </div>

                {/* SLIDE 2: ATTENTION SHIFT */}
                <div className={getSlideClass(1)}>
                    <div className={styles.contentGrid}>
                        <div className={styles.cardBox} style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                            <h3>// The Shift</h3>
                            <h2>From "Attention"<br />to "Presence".</h2>
                            <p>The "Feed" is saturated. As platforms like TikTok and Twitch mature, we are moving from passive scrolling to active, synchronous participation.</p>
                            <p><strong>The Opportunity:</strong> Moving from buying 3 seconds of a user's time to owning 25 minutes of their attention.</p>
                        </div>
                        <div className={styles.cardBox}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Average Engagement Time</div>
                            <div className={styles.metricContainer}>
                                <div className={styles.metricRow}>
                                    <div className={styles.metricLabel}>Static Video</div>
                                    <div className={styles.barBg}>
                                        <div className={`${styles.barFill} ${styles.barSmall}`}><span>3 Secs</span></div>
                                    </div>
                                </div>
                                <div className={styles.metricRow}>
                                    <div className={styles.metricLabel}>Live Stream</div>
                                    <div className={styles.barBg}>
                                        <div className={`${styles.barFill} ${styles.barLarge}`}>25 Minutes (8x Higher)</div>
                                    </div>
                                </div>
                            </div>
                            <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#888' }}>Source: Forrester Research, 2024. Live Streaming Market to hit $345B by 2030.</p>
                        </div>
                    </div>
                </div>

                {/* SLIDE 3: THE PROBLEM */}
                <div className={getSlideClass(2)}>
                    <div className={styles.contentGrid}>
                        <div className={styles.cardBox} style={{ background: '#fcfcfc' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}></div>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>The Problem</div>
                            <p>Booking "Live" is Logistics, not E-commerce.</p>
                            <p>Brands want a "Friday 8PM Takeover," but current infrastructure treats live talent like file delivery. There are no guardrails for execution.</p>
                            <ul style={{ fontSize: '0.9rem', color: '#555', marginTop: '20px' }}>
                                <li style={{ marginBottom: '10px' }}>❌ <strong>No Guarantees:</strong> 10 mins late = Failed Campaign.</li>
                                <li style={{ marginBottom: '10px' }}>❌ <strong>No Control:</strong> "Go Live" means losing editorial oversight.</li>
                                <li style={{ marginBottom: '10px' }}>❌ <strong>No Scale:</strong> Managing 50 streamers = 50 producers.</li>
                            </ul>
                        </div>
                        <div className="panel">
                            <h3>// The Gap</h3>
                            <h2>High Risk,<br />High Reward.</h2>
                            <p>Without infrastructure, Live Streaming is too risky for major Brand Marketing budgets.</p>
                            <p>Brands are forced to choose between <strong>Chaotic Direct Deals</strong> (DMs/Emails) or <strong>Expensive Agencies</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* SLIDE 4: MARKET GAP */}
                <div className={getSlideClass(3)}>
                    <div className={styles.fullCenter}>
                        <h3>// The Market Gap</h3>
                        <h2>The "Experience" Economy</h2>
                        <div className={styles.vennContainer}>
                            <div className={`${styles.circle} ${styles.circle1}`}>
                                <div>
                                    <strong>Live Shopping</strong><br />
                                    (Bambuser, Whatnot)<br />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>Transactional.<br />High Churn.<br />Hard Sell.</span>
                                </div>
                            </div>
                            <div className={`${styles.circle} ${styles.circle2}`}>
                                <div>
                                    <strong>Static Talent</strong><br />
                                    (Collabstr, Fiverr)<br />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>No Live Tools.<br />Low Trust.<br />Asset Based.</span>
                                </div>
                            </div>
                            <div className={styles.circleCenter}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>ON CUE</div>
                                <div style={{ fontSize: '0.8rem' }}>Experiential Marketing</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '5px' }}>Entertainment First.<br />Brand Safe.<br />Structured.</div>
                            </div>
                        </div>
                        <p style={{ marginTop: '40px', maxWidth: '600px' }}>
                            Western audiences resist the "Hard Sell" of Live Commerce. <br />We capture the massive budget for <strong>Brand Experience</strong>, not just conversion.
                        </p>
                    </div>
                </div>

                {/* SLIDE 5: THE PRODUCT */}
                <div className={getSlideClass(4)}>
                    <div className={styles.contentGrid}>
                        <div className="panel">
                            <h3>// The Product</h3>
                            <h2>Discovery & Booking.</h2>
                            <p>The first marketplace that filters live streamers by <strong>Reliability</strong>, not just Followers.</p>
                            <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2 }}>
                                <li>✓ <strong>Time-Slot Inventory:</strong> Buy "Friday at 8PM" instantly.</li>
                                <li>✓ <strong>Live Reliability Score:</strong> Based on punctuality & brief adherence.</li>
                                <li>✓ <strong>Structured Briefs:</strong> Standardized "Run of Shows" for Q&As, Trivia, etc.</li>
                            </ul>
                        </div>
                        <div className={styles.marketplaceUi}>
                            <div className={styles.mpHeader}>
                                <div style={{ width: '15px', height: '15px', background: '#ff5f56', borderRadius: '50%' }}></div>
                                <div className={styles.mpSearch}></div>
                            </div>
                            <div className={styles.mpGrid}>
                                <div className={styles.mpCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div className={styles.mpAvatar}></div>
                                        <div className={styles.reliabilityBadge}>98% RELIABILITY</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', marginTop: '5px' }}>Sarah T.</div>
                                    <div style={{ fontSize: '10px', color: '#888' }}>Brief Adherence: High</div>
                                    <div className={styles.mpBtn}>BOOK FRIDAY 8PM</div>
                                </div>
                                <div className={styles.mpCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div className={styles.mpAvatar}></div>
                                        <div className={styles.reliabilityBadge}>95% RELIABILITY</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', marginTop: '5px' }}>TechTalks</div>
                                    <div style={{ fontSize: '10px', color: '#888' }}>Brief Adherence: Med</div>
                                    <div className={styles.mpBtn}>BOOK SATURDAY 9PM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SLIDE 6: TECHNOLOGY (PROMPTER) */}
                <div className={getSlideClass(5)}>
                    <div className={styles.contentGrid}>
                        <div className={styles.devicePair}>
                            <div className={styles.phone}>
                                <div className={styles.phoneScreen}>
                                    <div>
                                        TIKTOK<br />LIVE<br />APP<br />
                                        <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>(Public Feed)</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.ipad}>
                                <div className={styles.ipadHeader}>
                                    <span>● LIVE: 04:20</span>
                                    <span>VIEWERS: 1.2k</span>
                                </div>
                                <div className={styles.ipadBody}>
                                    <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Teleprompter</div>
                                    <div className={styles.teleprompter}>
                                        "Welcome everyone! Today we are unboxing the new summer collection..."
                                    </div>
                                    <div className={styles.commandMsg}>
                                        BRAND ALERT: Mention the 20% Discount Code now!
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="panel">
                            <h3>// The Technology</h3>
                            <h2>The Prompter.</h2>
                            <p><strong>The Problem:</strong> Platforms (TikTok/IG) restrict APIs. We cannot control the stream directly.</p>
                            <p><strong>Our Solution:</strong> We control the workflow.</p>
                            <p>1. Talent streams on <strong>Phone</strong> (Max Reach).<br />
                                2. Talent is directed by <strong>Tablet</strong> (Max Control).</p>
                            <p>This allows us to be platform-agnostic, working across TikTok, Instagram, Youtube, and Twitch simultaneously.</p>
                        </div>
                    </div>
                </div>

                {/* SLIDE 7: GUARDRAILS */}
                <div className={getSlideClass(6)}>
                    <div className={styles.contentGrid}>
                        <div className="panel">
                            <h3>// The Guardrails</h3>
                            <h2>The Digital Producer.</h2>
                            <p>The "The Prompter" App acts as an automated stage manager.</p>
                            <p><strong>Real-Time Direction:</strong> Brands can send messages directly to the talent's second device ("Show the product close up!").</p>
                            <p><strong>AI Verification:</strong> The app listens to the audio. If the talent says the brand name, the milestone is checked automatically.</p>
                        </div>
                        <div className={styles.marketplaceUi} style={{ background: '#222', color: 'white', border: '4px solid #444' }}>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ color: '#888', fontSize: '10px', letterSpacing: '1px' }}>LIVE COMMAND CENTER</div>
                                <div style={{ marginTop: '20px', background: '#333', padding: '10px', borderRadius: '5px' }}>
                                    <span style={{ color: '#4caf50' }}>AI MONITORING:</span><br />
                                    ✅ Keyword "Summer Sale" Detected.<br />
                                    ✅ Brand Safety: Secure.
                                </div>
                                <div style={{ marginTop: 'auto', borderTop: '1px solid #444', paddingTop: '10px' }}>
                                    Current Segment: <span style={{ color: 'var(--accent-gold)' }}>Q&A Session</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SLIDE 8: BUSINESS MODEL */}
                <div className={getSlideClass(7)}>
                    <div className={styles.fullCenter}>
                        <h3>// The Business Model</h3>
                        <h2>Monetizing Reliability.</h2>
                        <div className={styles.pricingGrid}>
                            <div className={styles.priceCol}>
                                <div className={styles.priceTitle}>Marketplace Fee</div>
                                <span className={styles.pricePercent}>20%</span>
                                <p style={{ fontSize: '0.9rem' }}>Standard commission on the total booking value (Talent Fee).</p>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 'auto' }}>Transactional</div>
                            </div>
                            <div className={`${styles.priceCol} ${styles.featured}`}>
                                <div className={styles.priceTitle}>Performance Hold</div>
                                <span className={styles.pricePercent}>10%</span>
                                <p style={{ fontSize: '0.9rem' }}>Escrow funds released only when AI verifies brief adherence. We take a float interest.</p>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 'auto' }}>Fintech Float</div>
                            </div>
                            <div className={styles.priceCol}>
                                <div className={styles.priceTitle}>SaaS Premium</div>
                                <span className={styles.pricePercent}>$99<span style={{ fontSize: '1rem' }}>/mo</span></span>
                                <p style={{ fontSize: '0.9rem' }}>Brand Subscription for advanced "The Prompter" features (Live Chat, AI Analysis).</p>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 'auto' }}>Recurring Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SLIDE 9: TRACTION / DATA */}
                <div className={getSlideClass(8)}>
                    <div className={styles.contentGrid}>
                        <div className={styles.cardBox} style={{ background: '#f9f9f9' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>The Reliability Index</div>
                            <div style={{ marginTop: '20px', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                                <div style={{ width: '50%', height: '40%', background: '#ccc', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '10px', fontSize: '0.7rem', color: 'white' }}>TIKTOK DATA</div>
                                <div style={{ width: '50%', height: '90%', background: 'var(--text-main)', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '10px', fontSize: '0.7rem', color: 'white' }}>OUR DATA</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: '#555' }}>
                                <span>Views & Likes</span>
                                <span style={{ textAlign: 'right' }}>Punctuality &<br />Brief Adherence</span>
                            </div>
                        </div>
                        <div className="panel">
                            <h3>// The Moat</h3>
                            <h2>Data Defensibility.</h2>
                            <p><em>"Why can't TikTok do this?"</em></p>
                            <p><strong>Answer:</strong> TikTok optimizes for Views. We optimize for Trust.</p>
                            <p>We are building the industry's first proprietary dataset of "Live Reliability"—knowing exactly who shows up on time, who handles live interactions well, and who converts.</p>
                        </div>
                    </div>
                </div>

                {/* SLIDE 10: SKILL GAP */}
                <div className={getSlideClass(9)}>
                    <div className={styles.contentGrid}>
                        <div className={styles.cardBox} style={{ background: '#fcfcfc' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}></div>
                            <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '1.2rem' }}>The "Live" Skill Gap</div>
                            <p>The industry lumps "Content Creators" and "Streamers" into one bucket. But the skills are fundamentally different.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                                <div style={{ background: '#eee', padding: '15px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#777', marginBottom: '5px' }}>VIDEO MAKER</div>
                                    <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '0.8rem', color: '#555' }}>
                                        <li>Scripting</li>
                                        <li>Editing & Polish</li>
                                        <li>Asynchronous</li>
                                    </ul>
                                </div>
                                <div style={{ background: 'var(--text-main)', color: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '5px' }}>LIVE STREAMER</div>
                                    <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '0.8rem', color: 'white' }}>
                                        <li>Improv & Wit</li>
                                        <li>Crowd Work</li>
                                        <li>Real-Time Charisma</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <h3>// The Philosophy</h3>
                            <h2>Respecting the Craft.</h2>
                            <p>
                                We don't view live streaming as just "another format." We view it as <strong>performance</strong>.
                            </p>
                            <p>
                                Our platform is built to champion the creators who have mastered the terrifying, exhilarating art of holding a room's attention in real-time.
                            </p>
                            <p>
                                By building tools specifically for <em>performers</em>—not just editors—we unlock a level of engagement that pre-recorded video can never match.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SLIDE 11: VISION */}
                <div className={getSlideClass(10)}>
                    <div className={styles.fullCenter}>
                        <h3>// The Vision</h3>
                        <h1 style={{ fontSize: '5rem' }}>Programmatic Live.</h1>
                        <p style={{ maxWidth: '700px' }}>
                            Today, we book one streamer.<br />
                            Tomorrow, a brand clicks one button to deploy <strong>100 streamers simultaneously</strong> for a "Synchronous Roadblock" across the internet.
                        </p>
                        <div style={{ marginTop: '40px' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', width: '300px' }}>
                                {/* Dots */}
                                {[...Array(4)].map((_, i) => <div key={`gold-${i}`} style={{ width: '10px', height: '10px', background: 'var(--accent-gold)', borderRadius: '50%' }}></div>)}
                                {[...Array(4)].map((_, i) => <div key={`main-${i}`} style={{ width: '10px', height: '10px', background: 'var(--text-main)', borderRadius: '50%' }}></div>)}
                                {[...Array(4)].map((_, i) => <div key={`grey-${i}`} style={{ width: '10px', height: '10px', background: '#eee', borderRadius: '50%' }}></div>)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SLIDE 12: FOUNDER */}
                <div className={getSlideClass(11)}>
                    <div className={styles.contentGrid}>
                        <div className={styles.cardBox} style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '280px', height: '280px', background: '#eee', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '1px solid #ddd' }}>
                                {/* Update this image path to your local asset or public folder */}
                                <img src="/images/beets.jpg" alt="Michael Beets" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                
                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'var(--text-main)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}></div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                <h2 style={{ marginBottom: '5px', fontSize: '2rem' }}>Michael Beets</h2>
                                <div style={{ color: 'var(--accent-gold)', fontWeight: 600, letterSpacing: '1px', fontSize: '0.9rem' }}>Founder</div>
                            </div>
                        </div>

                        <div className="panel">
                            <h3>// The Architect</h3>
                            <h2>Bridging Digital & Physical.</h2>
                            <p>
                                The "Live-as-a-Service" model requires more than just code; it requires a deep understanding of <strong>audience dynamics</strong>.
                            </p>
                            <p>
                                Michael is the director of <strong>HERE & NOW</strong>, an immersive experience collective. For over a decade, he has led multidisciplinary teams of developers and artists to build award-winning experiences that make audiences feel <em>present</em>.
                            </p>

                            <div style={{ marginTop: '30px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '20px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '0.9rem' }}>RELEVANT EXPERIENCE</div>
                                <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                    <li><strong>Creative Direction:</strong> Creator of award-winning immersive experiences. His work has featured at most major festivals including Venice Biennale, Cannes, and Toronto International Film Festival.</li>
                                    <li><strong>Immersive Innovation:</strong> Pioneer in "Live Cinema" and creating immersive virtual art experiences</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                 {/* CONTROLS */}
                <div className={styles.controlsContainer}>
                    <button onClick={() => changeSlide(-1)}>Back</button>
                    <div className="slide-counter">
                        <span>{currentSlide + 1}</span> / <span>{totalSlides}</span>
                    </div>
                    <button onClick={() => changeSlide(1)}>Next</button>
                </div>

            </div>
        </div>
    );
};

export default PitchDeck;