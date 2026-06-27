import { Routes, Route } from "react-router-dom";
import MarketingDashboard from "./pages/MarketingDashboard";
import CampaignsList from "./pages/CampaignsList";
import WhatsAppCampaign from "./pages/WhatsAppCampaign";
import { LayoutDashboard, List, MessageCircle } from "lucide-react";

export const marketingMenuItems = [
    {
        key: "/marketing/dashboard",
        label: "Overview",
        icon: <LayoutDashboard size={18} />,
    },
    {
        key: "/marketing/campaigns",
        label: "Campaigns",
        icon: <List size={18} />,
    },
    {
        key: "/marketing/whatsapp",
        label: "WhatsApp",
        icon: <MessageCircle size={18} />,
    },
];

const MarketingRoutes = () => {
    return (
        <Routes>
            <Route path="dashboard" element={<MarketingDashboard />} />
            <Route path="campaigns" element={<CampaignsList />} />
            <Route path="whatsapp" element={<WhatsAppCampaign />} />
        </Routes>
    );
};

export default MarketingRoutes;
