
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyDPd4kx2ZSPlkU9njbv-o-WJ_m_hF1u85I",
    authDomain: "cehpoint-works.firebaseapp.com",
    projectId: "cehpoint-works",
    storageBucket: "cehpoint-works.appspot.com",
    messagingSenderId: "803363759845",
    appId: "1:803363759845:web:15ad86b9767e55c504d60c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEMO_DOMAINS = [
    {
        name: "Full Stack Development",
        stacks: ["React", "Node.js", "Next.js", "MongoDB", "PostgreSQL", "Express", "TypeScript"],
        createdAt: new Date().toISOString()
    },
    {
        name: "Frontend Development",
        stacks: ["React", "Vue.js", "Angular", "Tailwind CSS", "SASS", "Redux", "Framer Motion"],
        createdAt: new Date().toISOString()
    },
    {
        name: "Backend Development",
        stacks: ["Node.js", "Python", "Go", "Java", "Ruby on Rails", "Django", "FastAPI"],
        createdAt: new Date().toISOString()
    },
    {
        name: "DevOps",
        stacks: ["Docker", "Kubernetes", "Jenkins", "Terraform", "GitHub Actions", "Ansible", "Linux"],
        createdAt: new Date().toISOString()
    },
    {
        name: "Cloud Computing",
        stacks: ["AWS", "Azure", "Google Cloud", "Firebase", "DigitalOcean", "Serverless"],
        createdAt: new Date().toISOString()
    },
    {
        name: "Graphic Design",
        stacks: ["Photoshop", "Illustrator", "Figma", "Canva", "After Effects", "UI/UX Design", "Indesign"],
        createdAt: new Date().toISOString()
    },
    {
        name: "Digital Marketing",
        stacks: ["Social Media Ads", "Google Ads", "Content Strategy", "Email Marketing", "Copywriting", "Analytics"],
        createdAt: new Date().toISOString()
    },
    {
        name: "SEO Expert",
        stacks: ["Technical SEO", "On-page SEO", "Backlink Strategy", "Keyword Research", "SEMrush", "Ahrefs"],
        createdAt: new Date().toISOString()
    }
];

async function seed() {
    try {
        const domainsCol = collection(db, "domains");

        console.log("Cleaning up existing domains...");
        const existing = await getDocs(domainsCol);
        for (const d of existing.docs) {
            await deleteDoc(doc(db, "domains", d.id));
        }

        console.log("Seeding demo domains...");
        for (const domain of DEMO_DOMAINS) {
            const ref = await addDoc(domainsCol, domain);
            console.log(`✅ Seeded: ${domain.name} (${ref.id})`);
        }

        console.log("Done!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
}

seed();
