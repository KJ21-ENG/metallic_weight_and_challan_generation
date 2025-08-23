import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, styled } from '@mui/material';
import { APP_VERSION } from '../utils/version';
import aalekhanLogo from '../assets/Aalekhan_logo.jpg';
import {
  Language as GlobeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Build as WrenchIcon,
  Smartphone as MobileIcon,
  Business as BuildingIcon,
  Circle as CircleIcon,
  Star as StarIcon
} from '@mui/icons-material';

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

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return 100;
        }
        return prevProgress + 2;
      });
    }, duration / 50);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <SplashContainer>
      <MainCard>
        <LeftPanel>
          <LogoContainer>
            <LogoCircle>
              <LogoText 
                src={aalekhanLogo}
                alt="Aalekhan Logo"
              />
            </LogoCircle>
          </LogoContainer>
          
          <ContactInfo>
            <ContactItem>
              <GlobeIcon sx={{ fontSize: 20 }} />
              <span>www.aalekhantech.com</span>
            </ContactItem>
            <ContactItem>
              <PhoneIcon sx={{ fontSize: 20 }} />
              <span>+91 94095 40069</span>
            </ContactItem>
            <ContactItem>
              <EmailIcon sx={{ fontSize: 20 }} />
              <span>aalekhantech@gmail.com</span>
            </ContactItem>
          </ContactInfo>
        </LeftPanel>

        <RightPanel>
          <ServicesSection>
            <ServicesTitle>WHAT WE OFFER</ServicesTitle>
            <TitleUnderline />
            
            <ServicesList>
              <ServiceItem>
                <ServiceIcon>
                  <WrenchIcon />
                </ServiceIcon>
                <span>Custom Software Development</span>
              </ServiceItem>
              <ServiceItem>
                <ServiceIcon>
                  <MobileIcon />
                </ServiceIcon>
                <span>Mobile & Web App Solutions</span>
              </ServiceItem>
              <ServiceItem>
                <ServiceIcon>
                  <BuildingIcon />
                </ServiceIcon>
                <span>Website Development</span>
              </ServiceItem>
              <ServiceItem>
                <ServiceIcon>
                  <CircleIcon />
                </ServiceIcon>
                <span>UI/UX Design & Prototyping</span>
              </ServiceItem>
              <ServiceItem>
                <ServiceIcon>
                  <CircleIcon />
                </ServiceIcon>
                <span>DevOps & Automation</span>
              </ServiceItem>
              <ServiceItem>
                <ServiceIcon>
                  <StarIcon />
                </ServiceIcon>
                <span>Quality Assurance & Testing</span>
              </ServiceItem>
            </ServicesList>
          </ServicesSection>

          <BottomSection>
            <LoadingText>Loading application...</LoadingText>
            
            <Box sx={{ flex: 1, mx: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#E0E0E0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#1976D2',
                    borderRadius: 3,
                  }
                }} 
              />
            </Box>
            
            <VersionText>
              <DecorativeTriangle />
              v{APP_VERSION}
            </VersionText>
          </BottomSection>
        </RightPanel>
      </MainCard>
    </SplashContainer>
  );
};
