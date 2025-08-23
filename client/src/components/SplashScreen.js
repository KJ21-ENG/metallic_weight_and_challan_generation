import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, styled } from '@mui/material';
import { APP_VERSION } from '../utils/version';
import aalekhanLogo from '../assets/Aalekhan_logo.jpg';
import { Language as GlobeIcon, Phone as PhoneIcon, Email as EmailIcon, Build as WrenchIcon, Smartphone as MobileIcon, Business as BuildingIcon, Circle as CircleIcon, Star as StarIcon } from '@mui/icons-material';
const SplashContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%)',
    padding: theme.spacing(2),
}));
const MainCard = styled(Box)(({ theme }) => ({
    display: 'flex',
    maxWidth: 1000,
    width: '100%',
    minHeight: '70vh',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
}));
const LeftPanel = styled(Box)(({ theme }) => ({
    flex: '1 1 40%',
    background: 'linear-gradient(180deg, #1976D2 0%, #0D47A1 100%)',
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
}));
const RightPanel = styled(Box)(({ theme }) => ({
    flex: '1 1 60%',
    backgroundColor: 'white',
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
}));
const LogoContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
}));
const LogoCircle = styled(Box)(({ theme }) => ({
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
}));
const LogoText = styled('img')(({ theme }) => ({
    width: '330px',
    height: '330px',
    objectFit: 'contain',
}));
const ContactInfo = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    width: '100%',
}));
const ContactItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.9rem',
}));
const ServicesSection = styled(Box)(({ theme }) => ({
    flex: 1,
}));
const ServicesTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#0D47A1',
    marginBottom: theme.spacing(1),
}));
const TitleUnderline = styled(Box)(({ theme }) => ({
    width: 60,
    height: 3,
    backgroundColor: '#1976D2',
    marginBottom: theme.spacing(3),
}));
const ServicesList = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));
const ServiceItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    fontSize: '1rem',
    color: '#424242',
}));
const ServiceIcon = styled(Box)(({ theme }) => ({
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1976D2',
}));
const BottomSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(3),
}));
const LoadingText = styled(Typography)(({ theme }) => ({
    fontSize: '0.9rem',
    color: '#757575',
}));
const VersionText = styled(Typography)(({ theme }) => ({
    fontSize: '0.9rem',
    color: '#757575',
    position: 'relative',
}));
const DecorativeTriangle = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 20,
    height: 20,
    borderLeft: '46px solid transparent',
    borderRight: '46px solid transparent',
    borderBottom: '60px solid #E3F2FD',
    opacity: 0.7,
}));
export const SplashScreen = ({ onComplete, isAppReady = false, minDuration = 5000 }) => {
    const [progress, setProgress] = useState(0);
    const [startTime] = useState(Date.now());
    const [isCompleting, setIsCompleting] = useState(false);
    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prevProgress + 2;
            });
        }, minDuration / 50);
        return () => clearInterval(timer);
    }, [minDuration]);
    useEffect(() => {
        // Only complete when both minimum time has passed AND app is ready
        if (isAppReady && progress >= 100) {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime >= minDuration) {
                // Start fade-out effect
                setIsCompleting(true);
                // Add a small delay for smooth transition
                setTimeout(() => {
                    if (onComplete) {
                        onComplete();
                    }
                }, 500);
            }
        }
    }, [isAppReady, progress, startTime, minDuration, onComplete]);
    return (_jsx(SplashContainer, { sx: {
            opacity: isCompleting ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
        }, children: _jsxs(MainCard, { children: [_jsxs(LeftPanel, { children: [_jsx(LogoContainer, { children: _jsx(LogoCircle, { children: _jsx(LogoText, { src: aalekhanLogo, alt: "Aalekhan Logo" }) }) }), _jsxs(ContactInfo, { children: [_jsxs(ContactItem, { children: [_jsx(GlobeIcon, { sx: { fontSize: 20 } }), _jsx("span", { children: "www.aalekhantech.com" })] }), _jsxs(ContactItem, { children: [_jsx(PhoneIcon, { sx: { fontSize: 20 } }), _jsx("span", { children: "+91 94095 40069" })] }), _jsxs(ContactItem, { children: [_jsx(EmailIcon, { sx: { fontSize: 20 } }), _jsx("span", { children: "aalekhantech@gmail.com" })] })] })] }), _jsxs(RightPanel, { children: [_jsxs(ServicesSection, { children: [_jsx(ServicesTitle, { children: "WHAT WE OFFER" }), _jsx(TitleUnderline, {}), _jsxs(ServicesList, { children: [_jsxs(ServiceItem, { children: [_jsx(ServiceIcon, { children: _jsx(WrenchIcon, {}) }), _jsx("span", { children: "Custom Software Development" })] }), _jsxs(ServiceItem, { children: [_jsx(ServiceIcon, { children: _jsx(MobileIcon, {}) }), _jsx("span", { children: "Mobile & Web App Solutions" })] }), _jsxs(ServiceItem, { children: [_jsx(ServiceIcon, { children: _jsx(BuildingIcon, {}) }), _jsx("span", { children: "Website Development" })] }), _jsxs(ServiceItem, { children: [_jsx(ServiceIcon, { children: _jsx(CircleIcon, {}) }), _jsx("span", { children: "UI/UX Design & Prototyping" })] }), _jsxs(ServiceItem, { children: [_jsx(ServiceIcon, { children: _jsx(CircleIcon, {}) }), _jsx("span", { children: "DevOps & Automation" })] }), _jsxs(ServiceItem, { children: [_jsx(ServiceIcon, { children: _jsx(StarIcon, {}) }), _jsx("span", { children: "Quality Assurance & Testing" })] })] })] }), _jsxs(BottomSection, { children: [_jsx(LoadingText, { children: isAppReady ? 'Application ready...' : 'Loading application...' }), _jsx(Box, { sx: { flex: 1, mx: 2 }, children: _jsx(LinearProgress, { variant: "determinate", value: progress, sx: {
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: '#E0E0E0',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: isAppReady ? '#4CAF50' : '#1976D2',
                                                borderRadius: 3,
                                            }
                                        } }) }), _jsxs(VersionText, { children: [_jsx(DecorativeTriangle, {}), "v", APP_VERSION] })] })] })] }) }));
};
