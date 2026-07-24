'use client';

import { useState, useEffect } from 'react';

const heroImages = [
  '/hero1.jpg',
  '/hero2.jpg',
  '/hero3.jpg',
];

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGetQuote = () => {
    window.location.href = '/promo';
  };

    const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const username = loginData.username.trim();
    const password = loginData.password.trim();

    if (!username || !password) {
      alert('נא למלא שם משתמש וסיסמה');
      return;
    }

    // ===== מנהל =====
    if (username.toUpperCase() === 'ADMIN' && password === '123456') {
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('loggedInUser', 'ADMIN');
      localStorage.removeItem('clientMode');
      setShowLogin(false);
      window.location.href = '/event/1/guests';
      return;
    }

    // ===== טלפנית (EDITOR) =====
    if (username.toUpperCase() === 'EDITOR' && password === 'EDITOR88') {
      localStorage.setItem('userRole', 'editor');
      localStorage.setItem('loggedInUser', 'EDITOR');
      localStorage.removeItem('clientMode');
      setShowLogin(false);
      window.location.href = '/events';
      return;
    }

    // ===== לקוח =====
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const matchedEvent = events.find(
      (ev: any) => ev.username === username && ev.password === password
    );

    if (matchedEvent) {
      localStorage.setItem('userRole', 'client');
      localStorage.setItem('loggedInUser', username);
      localStorage.setItem('clientEventId', matchedEvent.id.toString());
      setShowLogin(false);
      window.location.href = `/event/${matchedEvent.id}/guests`;
      return;
    }

    alert('שם משתמש או סיסמה שגויים');
  };
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', direction: 'rtl' }}>
      
      {/* ===== TOP BAR ===== */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          onClick={() => setShowLogin(true)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            padding: '10px 22px',
            borderRadius: '30px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          🔐 כניסה לאירוע שלי
        </button>
        <a
          href="https://wa.me/972505270152"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'white',
            fontSize: '14px',
            opacity: 0.95,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ opacity: 0.85 }}>ליצירת קשר:</span>
          <span style={{ fontWeight: 'bold' }}>050-5270152</span>
        </a>
      </div>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '700px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Background images carousel */}
        {heroImages.map((img, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentImage === index ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 0,
            }}
          />
        ))}

        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.72))',
          zIndex: 1,
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: 'white',
          padding: '80px 16px 40px',
          width: '100%',
        }}>
          {/* לוגו לכל הרוחב - הכי למעלה */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '36px',
          }}>
                        <img
              src="/eventpay-logo.jpg"
              alt="EventPay"
              style={{
                width: 'min(92vw, 860px)',
                height: 'auto',
                maxHeight: '140px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.6))',
                mixBlendMode: 'multiply',
              }}
            />
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5.5vw, 56px)',
            fontWeight: 800,
            margin: '0 0 16px 0',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            lineHeight: 1.25,
          }}>
            האירוע שלכם.
            <br />
            <span style={{ color: '#fbbf24' }}>הכל תחת שליטה.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            margin: '0 0 40px 0',
            opacity: 0.95,
            maxWidth: '620px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            אישורי הגעה • סידורי הושבה • ניהול אירוע • דיילות
            <br />
            הפתרון המקצועי ביותר לאירועים בישראל
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleGetQuote}
              style={{
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                color: 'white',
                padding: '16px 42px',
                borderRadius: '50px',
                fontWeight: 'bold',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(217, 119, 6, 0.45)',
              }}
            >
              קבל הצעת מחיר
            </button>

            <a href="#services" style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '16px 42px',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '18px',
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.35)',
            }}>
              השירותים שלנו
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          color: 'white',
          opacity: 0.7,
          fontSize: '14px',
        }}>
          ↓ גלול למטה
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" style={{
        padding: '100px 20px',
        background: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 800,
            color: '#92400e',
            marginBottom: '16px',
          }}>
            השירותים שלנו
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            marginBottom: '60px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            כל מה שצריך כדי שהאירוע שלכם יעבור חלק, מקצועי ומרשים
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
          }}>
            {[
              {
                icon: '📱',
                title: 'אישורי הגעה',
                desc: 'שליחת הודעות WhatsApp + SMS + שיחות טלפון. מעקב בזמן אמת ודוחות מדויקים.',
              },
              {
                icon: '🪑',
                title: 'סידורי הושבה',
                desc: 'מערכת חכמה להושבת אורחים. מפות שולחנות אינטראקטיביות ונוחות.',
              },
              {
                icon: '🎁',
                title: 'קבלת מתנות',
                desc: 'מערכת מאובטחת לקבלת מתנות באשראי ישירות לאירוע. דוחות מסודרים.',
              },
              {
                icon: '💬',
                title: 'הודעות אוטומטיות',
                desc: 'תזכורות, הודעות תודה, וקישורי ניווט אוטומטיים ל-Waze.',
              },
              {
                icon: '👩‍💼',
                title: 'דיילות מקצועיות',
                desc: 'צוות דיילות מנוסה ומקצועי לאירוח האורחים ביום האירוע.',
              },
              {
                icon: '📊',
                title: 'ניהול אירוע מלא',
                desc: 'ליווי מלא מהתכנון ועד סוף האירוע. אתם נהנים – אנחנו דואגים להכל.',
              },
            ].map((service, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '20px',
                padding: '36px 28px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                border: '1px solid #fef3c7',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{service.icon}</div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#b45309',
                  marginBottom: '12px',
                }}>
                  {service.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#6b7280',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section style={{
        padding: '90px 20px',
        background: '#1c1917',
        color: 'white',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '38px',
            fontWeight: 800,
            marginBottom: '50px',
            color: '#fbbf24',
          }}>
            למה EventPay?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
          }}>
            {[
              { number: '10+', label: 'שנות ניסיון' },
              { number: '2,500+', label: 'אירועים מוצלחים' },
              { number: '98%', label: 'שביעות רצון' },
              { number: '24/7', label: 'תמיכה אישית' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#fbbf24',
                  marginBottom: '8px',
                }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '16px', opacity: 0.85 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        padding: '100px 20px',
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        textAlign: 'center',
        color: 'white',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '40px',
            fontWeight: 800,
            marginBottom: '20px',
          }}>
            מוכנים להתחיל?
          </h2>
          <p style={{
            fontSize: '18px',
            marginBottom: '36px',
            opacity: 0.95,
          }}>
            קבלו הצעת מחיר מותאמת אישית תוך דקות.
            <br />
            ללא התחייבות.
          </p>

          <button
            onClick={handleGetQuote}
            style={{
              display: 'inline-block',
              background: 'white',
              color: '#b45309',
              padding: '18px 50px',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '20px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            🚀 קבל הצעת מחיר עכשיו
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        background: '#0c0a09',
        color: '#a8a29e',
        padding: '50px 20px 30px',
        textAlign: 'center',
      }}>
        <img
          src="/eventpay-logo.jpg"
          alt="EventPay"
          style={{
            height: '48px',
            marginBottom: '20px',
            filter: 'brightness(0) invert(0.65)',
          }}
        />
        <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
          www.EventPay.co.il | Support@eventPay.co.il | 050-5270152
        </p>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>
          © {new Date().getFullYear()} EventPay. כל הזכויות שמורות.
        </p>
      </footer>

      {/* ===== LOGIN MODAL ===== */}
      {showLogin && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px 36px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowLogin(false)}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#9ca3af',
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <img
                src="/eventpay-logo.jpg"
                alt="EventPay"
                style={{ height: '50px', marginBottom: '12px' }}
              />
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1c1917',
                margin: 0,
              }}>
                כניסה לאירוע שלי
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px' }}>
                הזן שם משתמש וסיסמה
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  שם משתמש
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="שם המשתמש שלך"
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  סיסמה
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                התחבר
              </button>
            </form>

            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#9ca3af',
              marginTop: '20px',
              marginBottom: 0,
            }}>
              שכחת סיסמה? צור קשר: 050-5270152
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
