import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Brain,
    Pill,
    Siren,
    MessageSquare,
    Shield,
    ArrowRight,
    Sparkles,
    Activity,
    Heart,
    UserPlus,
    Bell,
    FileText,
    Mail,
    Phone,
    Stethoscope,
    Users
} from 'lucide-react'
import { useEffect, useRef } from 'react'

const features = [
    {
        icon: Brain,
        title: "AI Symptom Analysis",
        description: "Advanced AI analyzes your symptoms in real-time, providing instant insights and recommendations.",
        color: "from-purple-500 to-purple-600",
    },
    {
        icon: Pill,
        title: "Smart Medication Tracking",
        description: "Never miss a dose with intelligent reminders, refill alerts, and drug interaction checks.",
        color: "from-cyan-500 to-cyan-600",
    },
    {
        icon: Siren,
        title: "Emergency SOS System",
        description: "One-tap emergency alerts with automatic location sharing and medical ID access.",
        color: "from-red-500 to-red-600",
    },
    {
        icon: MessageSquare,
        title: "AI Consultation Memory",
        description: "Your AI remembers every symptom, diagnosis, and prescription for perfect continuity.",
        color: "from-green-500 to-green-600",
    },
    {
        icon: Stethoscope,
        title: "Seamless Doctor-Patient Interface",
        description: "Connect instantly with healthcare providers, share reports, and get professional medical advice seamlessly.",
        color: "from-orange-500 to-red-500",
    },
]

const steps = [
    {
        icon: UserPlus,
        title: "Create Your Profile",
        description: "Set up your health profile in minutes. Add medical history, allergies, and emergency contacts.",
        number: "01",
        color: "from-purple-500 to-pink-500"
    },
    {
        icon: Brain,
        title: "AI Learns Your Pattern",
        description: "Our AI studies your health patterns and provides personalized insights.",
        number: "02",
        color: "from-cyan-500 to-purple-500"
    },
    {
        icon: Shield,
        title: "Always Protected",
        description: "24/7 monitoring and instant emergency response at your fingertips.",
        number: "03",
        color: "from-purple-500 to-cyan-500"
    },
]

const stats = [
    { value: "99.9%", label: "Uptime", icon: Activity },
    { value: "< 2s", label: "Emergency Response", icon: Bell },
    { value: "10K+", label: "Active Users", icon: Users },
    { value: "24/7", label: "AI Support", icon: Sparkles },
]

// Heartbeat Graph Component
function HeartbeatGraph() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationId: number
        let offset = 0
        let scannerX = 0
        let scannerDirection = 1

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const drawHeartbeat = () => {
            if (!ctx || !canvas) return

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
            gradient.addColorStop(0, 'rgba(168, 85, 247, 0)')
            gradient.addColorStop(0.2, 'rgba(168, 85, 247, 0.9)')
            gradient.addColorStop(0.5, 'rgba(6, 182, 212, 1)')
            gradient.addColorStop(0.8, 'rgba(168, 85, 247, 0.9)')
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0)')

            ctx.beginPath()
            ctx.strokeStyle = gradient
            ctx.lineWidth = 2.5
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            const centerY = canvas.height / 2
            const step = canvas.width / 500

            for (let i = 0; i <= 500; i++) {
                const x = i * step
                const t = (x + offset) * 0.035
                let y = centerY

                const cyclePosition = t % 8

                if (cyclePosition < 1) {
                    y = centerY
                } else if (cyclePosition < 1.15) {
                    const progress = (cyclePosition - 1) / 0.15
                    y = centerY - 18 * Math.sin(progress * Math.PI)
                } else if (cyclePosition < 2) {
                    y = centerY
                } else if (cyclePosition < 2.15) {
                    const progress = (cyclePosition - 2) / 0.15
                    y = centerY + 12 * Math.sin(progress * Math.PI)
                } else if (cyclePosition < 2.4) {
                    const progress = (cyclePosition - 2.15) / 0.25
                    y = centerY - 95 * Math.sin(progress * Math.PI)
                } else if (cyclePosition < 2.7) {
                    const progress = (cyclePosition - 2.4) / 0.3
                    y = centerY + 55 * Math.sin(progress * Math.PI)
                } else if (cyclePosition < 3.4) {
                    const progress = (cyclePosition - 2.7) / 0.7
                    const easeOut = 1 - Math.pow(1 - progress, 1.5)
                    y = centerY + (55 * (1 - easeOut))
                } else if (cyclePosition < 4.3) {
                    const progress = (cyclePosition - 3.4) / 0.9
                    y = centerY - 28 * Math.sin(progress * Math.PI)
                } else if (cyclePosition < 5.2) {
                    y = centerY
                } else {
                    y = centerY
                }

                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }

            ctx.stroke()

            ctx.shadowBlur = 6
            ctx.shadowColor = 'rgba(168, 85, 247, 0.5)'
            ctx.stroke()
            ctx.shadowBlur = 0

            ctx.beginPath()
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)'
            ctx.lineWidth = 0.5

            for (let i = 0; i < 30; i++) {
                const x = (offset * 12 + i * 50) % canvas.width
                ctx.moveTo(x, 0)
                ctx.lineTo(x, canvas.height)
            }
            ctx.stroke()

            for (let i = -5; i <= 5; i++) {
                const y = centerY + i * 35
                ctx.beginPath()
                ctx.moveTo(0, y)
                ctx.lineTo(canvas.width, y)
                ctx.stroke()
            }

            const scanGradient = ctx.createLinearGradient(scannerX - 100, 0, scannerX + 100, 0)
            scanGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
            scanGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)')
            scanGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

            ctx.fillStyle = scanGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.beginPath()
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.lineWidth = 1.5
            ctx.moveTo(scannerX, 0)
            ctx.lineTo(scannerX, canvas.height)
            ctx.stroke()

            ctx.beginPath()
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)'
            ctx.lineWidth = 4
            ctx.moveTo(scannerX, 0)
            ctx.lineTo(scannerX, canvas.height)
            ctx.stroke()

            scannerX += scannerDirection * 3
            if (scannerX >= canvas.width) {
                scannerDirection = -1
            } else if (scannerX <= 0) {
                scannerDirection = 1
            }

            ctx.font = 'bold 12px "Courier New", monospace'
            ctx.fillStyle = 'rgba(168, 85, 247, 0.8)'
            ctx.shadowBlur = 0
            ctx.fillText('HR: 72 BPM', 20, 40)
            ctx.fillText('SINUS RHYTHM', 20, 58)
            ctx.fillStyle = 'rgba(6, 182, 212, 0.7)'
            ctx.fillText('LEAD II', canvas.width - 80, 40)
            ctx.fillStyle = 'rgba(168, 85, 247, 0.5)'
            ctx.fillText('25 mm/s', canvas.width - 80, 58)

            const time = Date.now() / 600
            if (Math.floor(time) % 2 === 0) {
                ctx.fillStyle = '#ef4444'
                ctx.beginPath()
                ctx.arc(canvas.width - 25, 25, 4, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
                ctx.fillText('REC', canvas.width - 55, 30)
            }

            offset = (offset + 2.2) % (Math.PI * 100)

            animationId = requestAnimationFrame(drawHeartbeat)
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
        drawHeartbeat()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            cancelAnimationFrame(animationId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-40"
            style={{ zIndex: 0 }}
        />
    )
}

export function Landing() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen relative">
            <HeartbeatGraph />

            {/* Header with Auth Buttons */}
            <header className="relative z-20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-purple-500 fill-purple-500" />
                            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                HealthCompanion
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate('/login')}
                                className="text-gray-300 hover:text-white hover:bg-white/10"
                            >
                                Login
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => navigate('/signup')}
                                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                            >
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 md:mb-8">
                            <Shield className="w-3 h-3 text-purple-400" />
                            <span className="text-xs font-medium text-gray-300">AI-Powered Health Guardian</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                            Your AI Health Memory
                            <br />
                            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
                                & Emergency Guardian
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                            The first AI companion that remembers your entire health journey,
                            provides instant symptom analysis, and protects you in emergencies.
                        </p>

                        {/* CTA Button - Single large Get Started */}
                        <div className="flex justify-center">
                            <Button
                                onClick={() => navigate('/dashboard')}
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/25 group px-8 py-6 text-lg"
                            >
                                Get Started
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform inline-block" />
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-white/10">
                            {stats.map((stat, idx) => {
                                const Icon = stat.icon
                                return (
                                    <div key={idx} className="text-center">
                                        <Icon className="w-4 h-4 md:w-5 md:h-5 text-purple-400 mx-auto mb-2" />
                                        <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                                        <div className="text-xs text-gray-500">{stat.label}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-10">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center">
                        <div className="w-1 h-2 bg-white/40 rounded-full mt-2 animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-24 relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Intelligent Features
                            </span>
                        </h2>
                        <p className="text-gray-400 text-base md:text-lg">
                            Everything you need to manage your health proactively
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {features.map((feature, idx) => {
                            const Icon = feature.icon
                            return (
                                <Card
                                    key={idx}
                                    className="group relative overflow-hidden backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                                >
                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <CardTitle className="text-lg md:text-xl text-white">{feature.title}</CardTitle>
                                        <CardDescription className="text-gray-400 text-sm md:text-base">
                                            {feature.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 md:py-24 relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                How It Works
                            </span>
                        </h2>
                        <p className="text-gray-400 text-base md:text-lg">
                            Three simple steps to complete health protection
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
                        {steps.map((step, idx) => {
                            const Icon = step.icon
                            return (
                                <div key={idx} className="relative group">
                                    <div className="relative z-10 text-center p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105">
                                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl relative overflow-hidden group-hover:shadow-2xl transition-all`}>
                                            <Icon className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10" />
                                        </div>

                                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{step.title}</h3>
                                        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                                            {step.description}
                                        </p>

                                        <div className="mt-4 inline-flex items-center gap-1 text-xs text-purple-400">
                                            <span>Step {step.number}</span>
                                            <div className="w-1 h-1 rounded-full bg-purple-400" />
                                            <span>Secure</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm mt-16 md:mt-20">
                <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="w-5 h-5 md:w-6 md:h-6 text-purple-500 fill-purple-500" />
                                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                    HealthCompanion
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4 max-w-sm">
                                Your AI-powered health memory and emergency guardian. Protecting what matters most, 24/7.
                            </p>
                            <p className="text-gray-500 text-xs">
                                Developed by Nerdy Kids out of curiosity for a good cause for society
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white mb-4">Product</h3>
                            <ul className="space-y-2">
                                {["Features", "Security", "API", "Support"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white mb-4">Company</h3>
                            <ul className="space-y-2">
                                {["About", "Blog", "Contact"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white mb-4">Legal</h3>
                            <ul className="space-y-2">
                                {["Privacy", "Terms", "HIPAA"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-gray-500 text-xs md:text-sm">
                                © 2026 HealthCompanion. All rights reserved.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                                    <Mail className="w-3 h-3" />
                                    <span>support@healthcompanion.com</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                                    <Phone className="w-3 h-3" />
                                    <span>+91 9024842617</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}