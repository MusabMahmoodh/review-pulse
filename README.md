# Review Pulse

**Collect student feedback. Improve teaching with AI insights.**

Review Pulse is a feedback collection platform designed for teachers and educational institutes. Students scan QR codes to leave feedback, and teachers get AI-powered insights and actionable items to improve their teaching.

## Features

- ✅ **QR-Based Feedback Collection** - Students scan QR codes to leave feedback instantly
- ✅ **Organization & Teacher Support** - Register as an institute (with multiple teachers) or as a standalone teacher
- ✅ **AI-Powered Insights** - Get AI-generated summaries, recommendations, and key topics from feedback
- ✅ **Actionable Items** - Convert feedback into trackable action items
- ✅ **Analytics Dashboard** - View feedback statistics, trends, and ratings
- ✅ **Mobile-First Design** - Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, TypeORM
- **Database**: PostgreSQL
- **AI**: OpenAI API for insights generation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/review-pulse.git
cd review-pulse
```

2. **Set up the backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials and API keys
npm run migration:run
npm run dev
```

3. **Set up the frontend**
```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

4. **Create an admin user**
```bash
cd server
npm run admin:create
```

Visit `http://localhost:3000` to see the application.

## Documentation

- [Server Setup Guide](./server/SETUP.md) - Detailed backend setup instructions
- [Development Setup](./dev-setup.md) - Setup with free cloud services
- [Production Setup](./prod-setup.md) - Production deployment guide
- [API Documentation](./server/README.md) - API endpoints and usage
- [Roadmap](./ROADMAP.md) - Product development roadmap

## Project Structure

```
review-pulse/
├── client/          # Next.js frontend application
├── server/          # Express backend API
├── docs/           # Documentation files
└── README.md       # This file
```

## Core Workflow

1. **Teacher/Institute Registration**
   - Register as an organization (can add multiple teachers) or as a single teacher
   - Get a unique QR code for feedback collection

2. **Student Feedback**
   - Students scan the QR code
   - Fill out feedback form (ratings + comments)
   - Submit feedback instantly

3. **AI Analysis**
   - System analyzes feedback using AI
   - Generates insights, recommendations, and key topics
   - Identifies patterns and trends

4. **Action Items**
   - Convert feedback into actionable items
   - Track completion status
   - Assign to team members

## Registration Types

### Organization Registration
- For educational institutes
- Can add multiple teachers
- Centralized management dashboard
- Shared subscription plans

### Teacher Registration
- For individual teachers
- Standalone account
- Can optionally join an organization later
- Personal QR code and dashboard

## Feedback Categories

Students provide ratings and feedback on:
- **Teaching Quality** - How well concepts are explained
- **Communication** - Clarity and responsiveness
- **Materials** - Quality of teaching materials/content
- **Overall Experience** - Overall satisfaction

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for teachers and students**

