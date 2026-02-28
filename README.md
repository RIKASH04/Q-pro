# Q-Pro — Smart Queue Management Platform

Q-Pro is a professional SaaS platform designed to help hospitals, government offices, and public services manage digital queues with real-time updates and seamless public access.

## 🚀 Live Demo
[https://q-pro.vercel.app/](https://q-pro.vercel.app/)

## ✨ Features
- **QR-Based Queue Joining**: Citizens scan a QR code to join the queue — no app download required.
- **Real-Time Updates**: Live token status powered by Supabase Realtime.
- **Wait Time Estimation**: Intelligent predictions based on average service time per department.
- **Multi-Tenant Security**: Strict role-based access for Super Admins and Office Admins.
- **Mobile-First Design**: Works seamlessly on any device.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion

## ⚙️ Setup & Installation
For detailed setup instructions, including Supabase configuration and database schema, please refer to the [SETUP.md](./SETUP.md) file.

## 👨‍💼 Role Guide
- **Super Admin**: Manage all offices, analytics, and admin assignments.
- **Office Admin**: Manage the live queue, serve next tokens, and control office status.
- **Public**: View offices and join queues without an account.

## 📄 License
MIT License
