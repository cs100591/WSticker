
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WeatherData } from '@/services/weatherService';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';

interface WeatherHeaderProps {
    weather: WeatherData | null;
    greeting: string;
    emoji: string;
    children?: React.ReactNode;
    style?: any;
}


import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://daily-pa1.vercel.app';

const ENGLISH_QUOTES = [
    "Believe you can and you're halfway there.",
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal.",
    "Your time is limited, don't waste it living someone else's life.",
    "Dream big and dare to fail.",
    "Action is the foundational key to all success.",
    "Don't watch the clock; do what it does. Keep going.",
    "Keep your face always toward the sunshine—and shadows will fall behind you."
];

const CHINESE_QUOTES = [
    "相信自己，你已经成功了一半。",
    "唯一能做出伟大的工作的方法就是热爱你所做的事。",
    "成功不是终点，失败也不是终结。",
    "你的时间有限，不要浪费在重复别人的生活上。",
    "敢于梦想，敢于失败。",
    "行动是所有成功的根本关键。",
    "不要盯着钟表；像它一样不停前行。",
    "永远面向阳光，阴影就会被甩在身后。"
];

const VIETNAMESE_QUOTES = [
    "Tin rằng bạn có thể và bạn đã đi được một nửa chặng đường.",
    "Cách duy nhất để làm việc tuyệt vời là yêu những gì bạn làm.",
    "Thành công không phải là đích đến, thất bại không phải là vực sâu.",
    "Thời gian của bạn có hạn, đừng lãng phí nó để sống cuộc đời của người khác.",
    "Hãy mơ lớn và dám thất bại.",
    "Hành động là chìa khóa cơ bản cho mọi thành công.",
    "Đừng nhìn đồng hồ; hãy làm những gì nó làm. Tiếp tục đi.",
    "Luôn hướng mặt về phía mặt trời — và bóng tối sẽ ngả về sau bạn."
];

const MALAY_QUOTES = [
    "Percaya anda boleh dan anda sudah separuh jalan.",
    "Satu-satunya cara melakukan kerja hebat adalah mencintai apa yang anda lakukan.",
    "Kejayaan bukan muktamad, kegagalan bukan penamat.",
    "Masa anda terhad, jangan bazirkannya menjalani hidup orang lain.",
    "Bermimpi besar dan berani gagal.",
    "Tindakan adalah kunci asas kepada semua kejayaan.",
    "Jangan tengok jam; buat apa yang ia lakukan. Teruskan.",
    "Sentiasa menghadap matahari - dan bayang-bayang akan jatuh di belakang anda."
];

const TAMIL_QUOTES = [
    "உங்களால் முடியும் என்று நம்புங்கள், நீங்கள் பாதி தூரத்தை கடந்துவிட்டீர்கள்.",
    "சிறந்த வேலையைச் செய்வதற்கான ஒரே வழி நீங்கள் செய்வதை நேசிப்பதே.",
    "வெற்றி இறுதி அல்ல, தோல்வி மரணமல்ல.",
    "உங்கள் நேரம் மட்டுப்படுத்தப்பட்டுள்ளது, அதை மற்றவரின் வாழ்க்கையை வாழ்வதில் வீணாக்காதீர்கள்.",
    "பெரிய கனவு காணுங்கள், தோல்வியடைய துணியுங்கள்.",
    "செயல் அனைத்து வெற்றிக்கும் அடிப்படை திறவுகோல்.",
    "கடிகாரத்தைப் பார்க்காதீர்கள்; அது செய்வதைச் செய்யுங்கள். தொடர்ந்து செல்லுங்கள்.",
    "உங்கள் முகத்தை எப்போதும் சூரியனை நோக்கி வையுங்கள் - நிழல்கள் உங்களுக்குப் பின்னால் விழும்."
];

const JAPANESE_QUOTES = [
    "自分を信じれば、道は半分開けている。",
    "素晴らしい仕事をする唯一の方法は、自分のやっていることを愛することだ。",
    "成功は決定的ではなく、失敗は致命的ではない。",
    "あなたの時間は限られている。他人の人生を生きて無駄にしてはいけない。",
    "大きく夢見よ、失敗を恐れるな。",
    "行動はすべての成功の基本的な鍵である。",
    "時計を見るな。時計と同じことをしろ。止まるな。",
    "顔をいつも太陽に向けていれば、影は背後にできる。"
];

const KOREAN_QUOTES = [
    "할 수 있다고 믿으면 이미 절반은 온 것입니다.",
    "위대한 일을 하는 유일한 방법은 당신이 하는 일을 사랑하는 것입니다.",
    "성공은 끝이 아니며, 실패는 치명적이지 않습니다.",
    "당신의 시간은 제한되어 있습니다. 남의 인생을 사느라 낭비하지 마세요.",
    "큰 꿈을 꾸고 실패를 두려워하지 마세요.",
    "행동은 모든 성공의 기본 열쇠입니다.",
    "시계를 보지 마세요. 시계가 하는 대로 하세요. 계속 나아가세요.",
    "항상 얼굴을 태양 향해 두세요. 그러면 그림자는 당신 뒤에 떨어질 것입니다."
];

const INDONESIAN_QUOTES = [
    "Percayalah Anda bisa dan Anda sudah setengah jalan.",
    "Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang Anda lakukan.",
    "Sukses bukanlah akhir, kegagalan bukanlah fatal.",
    "Waktu Anda terbatas, jangan sia-siakan dengan menjalani hidup orang lain.",
    "Bermimpilah besar dan berani gagal.",
    "Tindakan adalah kunci dasar untuk semua kesuksesan.",
    "Jangan melihat jam; lakukan apa yang dilakukannya. Teruslah berjalan.",
    "Jaga wajah Anda selalu ke arah sinar matahari—dan bayangan akan jatuh di belakang Anda."
];

const SPANISH_QUOTES = [
    "Cree que puedes y ya estás a medio camino.",
    "La única manera de hacer un gran trabajo es amar lo que haces.",
    "El éxito no es definitivo, el fracaso no es fatal.",
    "Tu tiempo es limitado, no lo desperdicies viviendo la vida de otro.",
    "Sueña en grande y atrévete a fallar.",
    "La acción es la clave fundamental de todo éxito.",
    "No mires el reloj; haz lo que él hace. Sigue adelante.",
    "Mantén tu rostro siempre hacia la luz del sol y las sombras caerán detrás de ti."
];

const FRENCH_QUOTES = [
    "Croyez que vous pouvez et vous êtes à mi-chemin.",
    "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
    "Le succès n'est pas final, l'échec n'est pas fatal.",
    "Votre temps est limité, ne le gâchez pas en menant une existence qui n'est pas la vôtre.",
    "Rêvez grand et osez échouer.",
    "L'action est la clé fondamentale de tout succès.",
    "Ne regardez pas l'horloge ; faites ce qu'elle fait. Continuez.",
    "Gardez toujours votre visage vers le soleil - et les ombres tomberont derrière vous."
];

const GERMAN_QUOTES = [
    "Glaube, dass du es kannst, und du bist schon halb dort.",
    "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.",
    "Erfolg ist nicht endgültig, Misserfolg ist nicht fatal.",
    "Deine Zeit ist begrenzt, verschwende sie nicht damit, das Leben eines anderen zu leben.",
    "Träume groß und wage es zu scheitern.",
    "Handeln ist der grundlegende Schlüssel zu jedem Erfolg.",
    "Schau nicht auf die Uhr; tu, was sie tut. Mach weiter.",
    "Richte dein Gesicht immer zur Sonne – und die Schatten fallen hinter dich."
];

const THAI_QUOTES = [
    "เชื่อว่าคุณทำได้ คุณก็มาได้ครึ่งทางแล้ว",
    "วิธีเดียวที่จะทำงานที่ยอดเยี่ยมคือรักในสิ่งที่คุณทำ",
    "ความสำเร็จไม่ใช่จุดสิ้นสุด ความล้มเหลวไม่ใช่เรื่องคอขาดบาดตาย",
    "เวลาของคุณมีจำกัด อย่าเสียเวลาไปกับการใช้ชีวิตของคนอื่น",
    "ฝันให้ใหญ่และกล้าที่จะล้มเหลว",
    "การลงมือทำคือกุญแจพื้นฐานของความสำเร็จทั้งหมด",
    "อย่ามองนาฬิกา; ทำสิ่งที่มันทำ เดินหน้าต่อไป",
    "หันหน้าไปทางแสงแดดเสมอ แล้วเงาจะตกอยู่ข้างหลังคุณ"
];

export const WeatherHeader: React.FC<WeatherHeaderProps> = ({ weather, greeting, emoji, children, style }) => {
    const lang = useEffectiveLanguage();
    // Animation for "breathing" effect
    const pulseAnim = useRef(new Animated.Value(0)).current;

    const [quote, setQuote] = React.useState('');

    // Select random quote on mount or language change
    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const response = await fetch(`${API_URL}/api/quote`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ language: lang }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.quote) {
                        setQuote(data.quote);
                        return;
                    }
                }
                throw new Error('Failed to fetch');
            } catch (error) {
                // Fallback to local quotes
                let quotes = ENGLISH_QUOTES;
                switch (lang) {
                    case 'zh': quotes = CHINESE_QUOTES; break;
                    case 'vi': quotes = VIETNAMESE_QUOTES; break;
                    case 'ms': quotes = MALAY_QUOTES; break;
                    case 'ta': quotes = TAMIL_QUOTES; break;
                    case 'ja': quotes = JAPANESE_QUOTES; break;
                    case 'ko': quotes = KOREAN_QUOTES; break;
                    case 'id': quotes = INDONESIAN_QUOTES; break;
                    case 'es': quotes = SPANISH_QUOTES; break;
                    case 'fr': quotes = FRENCH_QUOTES; break;
                    case 'de': quotes = GERMAN_QUOTES; break;
                    case 'th': quotes = THAI_QUOTES; break;
                    default: quotes = ENGLISH_QUOTES;
                }

                const randomIndex = Math.floor(Math.random() * quotes.length);
                setQuote(quotes[randomIndex]);
            }
        };

        fetchQuote();
    }, [lang]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false, // color interpolation doesn't support native driver
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        if (!weather) return ['#3B82F6', '#2563EB', '#1D4ED8']; // Default Blue

        const { weatherCode, isDay } = weather;

        // Night time override
        if (!isDay) return ['#0f2027', '#203a43', '#2c5364']; // Deep space

        // Weather based
        if (weatherCode === 0) return ['#2980B9', '#6DD5FA', '#FFFFFF']; // Clear Sky (Blue -> White)
        if (weatherCode >= 1 && weatherCode <= 3) return ['#83a4d4', '#b6fbff']; // Cloudy (Soft Blue)
        if (weatherCode >= 51 && weatherCode <= 67) return ['#373B44', '#4286f4']; // Rainy (Dark Grey -> Blue)
        if (weatherCode >= 71 && weatherCode <= 77) return ['#E6DADA', '#274046']; // Snow (White -> Cold Grey)
        if (weatherCode >= 80) return ['#232526', '#414345']; // Storm (Darkness)

        // Hot
        if (weather.temperature > 30) return ['#FF512F', '#DD2476']; // Burning Orange

        return ['#3B82F6', '#60A5FA']; // Default
    };

    const getOverlayColor = () => {
        if (!weather || !weather.isDay) return 'rgba(0,0,0,0.3)';
        if (weather.weatherCode === 0) return 'rgba(255,255,255,0.2)'; // Sun glimmer
        return 'rgba(255,255,255,0.0)';
    };

    const currentGradient = getGradientColors();

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={currentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Animated Overlay for "Live" effect */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        backgroundColor: getOverlayColor(),
                        opacity: pulseAnim
                    }
                ]}
            />

            {/* Cloud/Sun Decoration (Simple circles/shapes could be added here) */}

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.greeting}>{greeting} {emoji}</Text>
                    <Text style={styles.subtitle}>{quote}</Text>
                </View>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 70, // Increased from 60
        paddingBottom: 35, // Increased from 24
        paddingHorizontal: 24,
        borderBottomLeftRadius: 36, // Increased radius
        borderBottomRightRadius: 36,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 180, // Ensure it's taller
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
    },
    textContainer: {
        flex: 1,
        paddingRight: 16,
    },
    greeting: {
        fontSize: 32, // Increased from 28
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16, // Increased from 14
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '500',
        lineHeight: 22,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
