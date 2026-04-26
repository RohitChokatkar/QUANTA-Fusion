// QuantFusion — App root with routing, navbar, footer, and all core components
import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from './components/Toast';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import MarketStatus from './components/MarketStatus';
import CookieBanner from './components/CookieBanner';
import RoboAdvisor from './components/RoboAdvisor';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ToolsPage from './pages/ToolsPage';
import Glossary from './pages/Glossary';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ComparePage from './pages/ComparePage';
import NewsPage from './pages/NewsPage';

function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close mobile nav on route change
    const closeMobile = () => setMobileOpen(false);

    // Don't show navbar on landing page
    const isLanding = location.pathname === '/';

    // Close three-dot menu on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [menuOpen]);

    return (
        <>
            <nav className={`navbar ${isLanding ? 'navbar-transparent' : ''}`}>
                <NavLink to="/" className="navbar-brand" onClick={closeMobile}>
                    <div className="navbar-logo">QF</div>
                    <span className="navbar-title">QuantFusion</span>
                </NavLink>

                {/* Desktop links */}
                <ul className="navbar-links navbar-desktop">
                    <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>📊 Dashboard</NavLink></li>
                    <li><NavLink to="/news" className={({ isActive }) => isActive ? 'active' : ''}>📰 News</NavLink></li>
                    <li><NavLink to="/compare" className={({ isActive }) => isActive ? 'active' : ''}>⚖️ Comparison</NavLink></li>
                    <li><NavLink to="/tools" className={({ isActive }) => isActive ? 'active' : ''}>🛠️ Tools</NavLink></li>
                    <li><NavLink to="/glossary" className={({ isActive }) => isActive ? 'active' : ''}>📖 Glossary</NavLink></li>
                    <li><NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>ℹ About</NavLink></li>
                </ul>

                <div className="navbar-right">
                    <MarketStatus />

                    {/* Three-dot menu for overflow items */}
                    <div className="three-dot-menu" ref={menuRef}>
                        <button
                            className="three-dot-btn"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="More options"
                        >
                            <span /><span /><span />
                        </button>
                        {menuOpen && (
                            <div className="three-dot-dropdown">
                                <NavLink
                                    to="/contact"
                                    className="three-dot-item"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span className="three-dot-item-icon">✉️</span>
                                    Contact Us
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Hamburger */}
                    <button
                        className={`hamburger ${mobileOpen ? 'hamburger-open' : ''}`}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && <div className="mobile-overlay" onClick={closeMobile} />}
            <div className={`mobile-menu ${mobileOpen ? 'mobile-menu-open' : ''}`}>
                <NavLink to="/dashboard" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>📊 Dashboard</NavLink>
                <NavLink to="/news" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>📰 News</NavLink>
                <NavLink to="/compare" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>⚖️ Comparison</NavLink>
                <NavLink to="/tools" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>🛠️ Tools</NavLink>
                <NavLink to="/glossary" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>📖 Glossary</NavLink>
                <NavLink to="/about" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>ℹ About</NavLink>
                <NavLink to="/contact" onClick={closeMobile} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}>✉ Contact</NavLink>
            </div>
        </>
    );
}

// Scroll restoration on route change
function ScrollRestoration() {
    const { pathname } = useLocation();
    // Scroll to top on route change
    useState(() => {
        window.scrollTo(0, 0);
    });
    // We use useState as a mount-effect trick (React 18+ safe)
    return null;
}

function AppContent() {
    const location = useLocation();
    const isLanding = location.pathname === '/';

    return (
        <div className="app-layout">
            <Navbar />
            <main className={isLanding ? 'page-content-landing' : 'page-content'}>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/tools" element={<ToolsPage />} />
                    <Route path="/compare" element={<ComparePage />} />
                    <Route path="/glossary" element={<Glossary />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
            <ScrollToTop />
            <CookieBanner />
            <RoboAdvisor />
        </div>
    );
}

function App() {
    return (
        <Provider store={store}>
            <ToastProvider>
                <BrowserRouter>
                    <ScrollRestoration />
                    <AppContent />
                </BrowserRouter>
            </ToastProvider>
        </Provider>
    );
}

export default App;
