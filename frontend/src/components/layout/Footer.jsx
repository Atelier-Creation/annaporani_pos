import { Layout } from "antd";

const { Footer } = Layout;

const AppFooter = ({ theme = 'light', bgColor }) => {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-600';

  return (
    <Footer style={{ backgroundColor: bgColor, textAlign: "center", position: "sticky", bottom: 0, zIndex: 1000,paddingTop:5, paddingBottom:5 }}>
      <span className={`text-black text-sm`}>
        © 2025 Atelier. All rights reserved.
      </span>
    </Footer>
  );
};

export default AppFooter;
