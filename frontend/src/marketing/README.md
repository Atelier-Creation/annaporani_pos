# Marketing Module - Frontend

Complete frontend implementation for Meta (Facebook/Instagram) advertising management.

## Features

✅ **Marketing Dashboard**
- Real-time performance metrics (Spend, Impressions, Clicks, CTR)
- Ad account overview
- Active campaigns summary
- Quick actions

✅ **Campaigns Management**
- List all campaigns with status
- Create new campaigns
- Pause/Resume/Delete campaigns
- View campaign insights
- Real-time performance data

✅ **WhatsApp Campaigns**
- Customer segmentation
- Send bulk messages
- Template management

## Files Structure

```
marketing/
├── pages/
│   ├── MarketingDashboard.jsx    # Main dashboard with metrics
│   ├── CampaignsList.jsx         # Campaign management
│   └── WhatsAppCampaign.jsx      # WhatsApp messaging
├── service/
│   └── metaApi.js                # Meta API service layer
├── AppRoutes.jsx                 # Route configuration
└── README.md                     # This file
```

## Setup

### 1. Install Dependencies (if needed)

The project already uses:
- React
- Ant Design (antd)
- Axios
- React Router

### 2. Environment Configuration

Ensure your `.env` file has:
```env
VITE_API_URL=http://localhost:10000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

## Usage

### Access the Marketing Module

Navigate to:
- Dashboard: `http://localhost:5173/marketing/dashboard`
- Campaigns: `http://localhost:5173/marketing/campaigns`
- WhatsApp: `http://localhost:5173/marketing/whatsapp`

### Connect Meta Account

1. Go to Marketing Dashboard
2. Click "Connect Meta Account" button
3. Complete OAuth authorization
4. You'll be redirected back to the dashboard

### Create a Campaign

1. Go to Campaigns page
2. Click "Create Campaign" button
3. Fill in:
   - Campaign Name
   - Objective (Traffic, Sales, Awareness, etc.)
   - Initial Status (Paused recommended)
4. Click "Create Campaign"

### Manage Campaigns

- **View Insights**: Click eye icon to see performance metrics
- **Pause/Resume**: Click pause/play icon to change status
- **Delete**: Click delete icon to remove campaign

## API Integration

All API calls go through `service/metaApi.js`:

```javascript
import * as metaApi from '../service/metaApi';

// Get campaigns
const campaigns = await metaApi.getCampaigns();

// Create campaign
await metaApi.createCampaign({
  name: 'Summer Sale',
  objective: 'OUTCOME_TRAFFIC',
  status: 'PAUSED'
});

// Update status
await metaApi.updateCampaignStatus(campaignId, 'ACTIVE');
```

## Components Overview

### MarketingDashboard.jsx

**Features:**
- Connection status check
- Performance metrics cards (Spend, Impressions, Clicks, CTR, etc.)
- Recent campaigns list
- Quick action buttons

**Key Functions:**
- `loadDashboardData()` - Loads all dashboard data
- `handleConnectMeta()` - Initiates OAuth flow

### CampaignsList.jsx

**Features:**
- Campaigns table with sorting/filtering
- Create campaign modal
- Campaign insights modal
- Status management (Pause/Resume/Delete)

**Key Functions:**
- `loadCampaigns()` - Fetches all campaigns
- `handleCreateCampaign()` - Creates new campaign
- `handleUpdateStatus()` - Updates campaign status
- `handleViewInsights()` - Shows campaign performance

## Customization

### Change Currency Display

In `MarketingDashboard.jsx` and `CampaignsList.jsx`, update:
```javascript
// Change from ₹ to $
prefix="$"  // or use adAccount?.currency
```

### Add More Metrics

In `MarketingDashboard.jsx`, add new metric cards:
```javascript
<Col xs={24} sm={12} lg={6}>
    <Card>
        <Statistic
            title="Conversions"
            value={insights?.conversions || 0}
        />
    </Card>
</Col>
```

### Customize Campaign Objectives

In `CampaignsList.jsx`, modify the Select options:
```javascript
<Select placeholder="Select objective">
    <Option value="OUTCOME_TRAFFIC">Website Traffic</Option>
    <Option value="OUTCOME_SALES">Online Sales</Option>
    // Add more...
</Select>
```

## Troubleshooting

### "Failed to load dashboard data"

**Solution:**
1. Check backend is running on port 10000
2. Verify `VITE_API_URL` in `.env`
3. Check Meta credentials in backend `.env`
4. Run backend test: `node src/marketing/test-meta-api.js`

### "Meta Account Not Connected"

**Solution:**
1. Click "Connect Meta Account" button
2. Complete OAuth authorization
3. Ensure redirect URI is configured in Meta App Dashboard

### Campaigns not showing

**Solution:**
1. Check if you have campaigns in your Meta ad account
2. Verify API credentials are correct
3. Check browser console for errors
4. Test API directly: `curl http://localhost:10000/api/v1/marketing/meta/campaigns`

### CORS errors

**Solution:**
Backend already has CORS configured. If issues persist:
1. Check backend `src/index.js` CORS settings
2. Ensure frontend URL is in allowed origins
3. Clear browser cache

## Next Steps

### Enhance Dashboard
- [ ] Add date range picker for insights
- [ ] Add charts/graphs for trends
- [ ] Add campaign comparison
- [ ] Add export to CSV/PDF

### Improve Campaigns
- [ ] Add bulk actions (pause/resume multiple)
- [ ] Add campaign duplication
- [ ] Add advanced filters
- [ ] Add campaign scheduling

### Add Features
- [ ] Ad set management page
- [ ] Individual ads management
- [ ] Audience builder
- [ ] Budget optimizer
- [ ] Automated rules

## Resources

- Backend API Docs: `be/src/marketing/META_API_GUIDE.md`
- Meta Marketing API: https://developers.facebook.com/docs/marketing-api
- Ant Design Components: https://ant.design/components/overview/
