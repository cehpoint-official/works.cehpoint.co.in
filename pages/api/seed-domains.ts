
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../utils/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Simple "security" - check for a query param or just run it once
    if (req.query.key !== 'seed123') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const domainsCol = collection(db, "domains");

        // 1. Clear existing domains (optional, but keep it clean for demo)
        const existing = await getDocs(domainsCol);
        for (const d of existing.docs) {
            await deleteDoc(doc(db, "domains", d.id));
        }

        // 2. Add demo domains
        const results = [];
        for (const domain of DEMO_DOMAINS) {
            const ref = await addDoc(domainsCol, domain);
            results.push({ id: ref.id, ...domain });
        }

        return res.status(200).json({
            message: 'Demo domains seeded successfully',
            count: results.length,
            domains: results
        });
    } catch (error) {
        console.error('Seeding error:', error);
        return res.status(500).json({ message: 'Failed to seed domains', error: String(error) });
    }
}
