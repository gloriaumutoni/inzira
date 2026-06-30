import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const careers = [
  { title: 'Software Engineer', description: 'Designs, builds, and maintains software applications and systems. Works across web, mobile, and backend technologies to solve real-world problems through code.', sector: 'Technology', combinations: ['MPC', 'PCM', 'PCB'] },
  { title: 'Civil Engineer', description: "Plans and oversees construction of infrastructure such as roads, bridges, and buildings. Critical to Rwanda's growing urban development.", sector: 'Engineering', combinations: ['MPC', 'MPG', 'PCM'] },
  { title: 'Medical Doctor', description: 'Diagnoses and treats illness, performs examinations, and provides patient care in hospitals and clinics across the country.', sector: 'Healthcare', combinations: ['PCB', 'BCG'] },
  { title: 'Pharmacist', description: 'Prepares and dispenses medication, advises patients on proper drug use, and works closely with doctors on treatment plans.', sector: 'Healthcare', combinations: ['PCB', 'BCG'] },
  { title: 'Architect', description: "Designs buildings and spaces that are functional, safe, and sustainable — shaping how Rwanda's cities and homes look and feel.", sector: 'Architecture', combinations: ['MPC', 'MPG'] },
  { title: 'Data Analyst', description: 'Collects and interprets data to help organisations make better decisions — a fast-growing field across finance, health, and tech in Rwanda.', sector: 'Technology', combinations: ['MPC', 'MEG', 'MCE'] },
  { title: 'Accountant', description: 'Manages financial records, prepares reports, and ensures businesses comply with tax and financial regulations.', sector: 'Finance', combinations: ['MEG', 'MCE', 'HEG'] },
  { title: 'Investment Banker', description: 'Helps companies and governments raise capital, manages large financial transactions, and advises on mergers and acquisitions.', sector: 'Finance', combinations: ['MEG', 'MCE'] },
  { title: 'Economist', description: 'Studies how resources are produced and distributed, advising government and businesses on policy and strategy.', sector: 'Finance', combinations: ['MEG', 'HEG', 'HEL'] },
  { title: 'Secondary School Teacher', description: "Educates the next generation, specialising in subjects like math, sciences, or languages within Rwanda's secondary schools.", sector: 'Education', combinations: ['HEL', 'HGL', 'KEL', 'KGL'] },
  { title: 'University Lecturer', description: 'Teaches and conducts research at the university level, shaping future professionals in their field of expertise.', sector: 'Education', combinations: ['HEG', 'HEL', 'MEG'] },
  { title: 'Agronomist', description: "Studies soil and crop science to improve farming practices — vital to Rwanda's agriculture-driven economy.", sector: 'Agriculture', combinations: ['BCG', 'AEG', 'PCB'] },
  { title: 'Agricultural Engineer', description: 'Designs equipment, systems, and processes that improve farming efficiency and food production.', sector: 'Agriculture', combinations: ['AEG', 'MPC', 'PCB'] },
  { title: 'Lawyer', description: "Represents clients in legal matters, advises on the law, and works in courts, businesses, or government.", sector: 'Law', combinations: ['HEG', 'HEL', 'HGL'] },
  { title: 'Judge', description: "Presides over court proceedings and makes legal rulings — a senior role within Rwanda's justice system.", sector: 'Law', combinations: ['HEG', 'HEL'] },
  { title: 'Graphic Designer', description: 'Creates visual content for brands, media, and digital products — combining creativity with commercial purpose.', sector: 'Arts & Media', combinations: ['HGL', 'KGL', 'MPG'] },
  { title: 'Journalist', description: 'Researches, writes, and reports news stories across print, broadcast, and digital media in Rwanda and beyond.', sector: 'Arts & Media', combinations: ['HEL', 'HGL', 'KEL'] },
  { title: 'Marketing Manager', description: 'Plans and executes campaigns that promote products and services, working across digital, social, and traditional media.', sector: 'Business', combinations: ['MEG', 'HEG', 'MCE'] },
  { title: 'Entrepreneur / Business Owner', description: "Builds and runs their own business — a path increasingly popular among young Rwandans across every sector.", sector: 'Business', combinations: ['MEG', 'MCE', 'HEG'] },
  { title: 'Human Resources Manager', description: 'Manages recruitment, employee relations, and workplace culture within organisations.', sector: 'Business', combinations: ['HEG', 'HEL', 'MEG'] },
  { title: 'Mechanical Engineer', description: 'Designs and builds machines, engines, and mechanical systems used across manufacturing and industry.', sector: 'Engineering', combinations: ['MPC', 'PCM', 'PCG'] },
  { title: 'Electrical Engineer', description: "Designs and maintains electrical systems, from power grids to electronics — key to Rwanda's energy expansion.", sector: 'Engineering', combinations: ['MPC', 'PCM'] },
  { title: 'Environmental Scientist', description: 'Studies the environment and advises on conservation, sustainability, and climate policy.', sector: 'Agriculture', combinations: ['BCG', 'PCG', 'AEG'] },
  { title: 'Logistics Manager', description: 'Coordinates the movement of goods and supplies, ensuring efficient supply chains across businesses.', sector: 'Business', combinations: ['MEG', 'MCE', 'HEG'] },
  { title: 'Cybersecurity Specialist', description: 'Protects organisations from digital threats by securing networks, systems, and data — a growing need as Rwanda digitises.', sector: 'Technology', combinations: ['MPC', 'PCM'] },
  { title: 'UX/UI Designer', description: 'Designs how digital products look and feel, focusing on making technology easy and enjoyable to use.', sector: 'Technology', combinations: ['MPG', 'HGL', 'MPC'] },
  { title: 'Nurse', description: 'Provides direct patient care, supports doctors, and plays a critical role in hospitals and health centres nationwide.', sector: 'Healthcare', combinations: ['PCB', 'BCG'] },
  { title: 'Public Health Officer', description: "Works on disease prevention and health policy at a community or national level, often with NGOs or government.", sector: 'Healthcare', combinations: ['BCG', 'HEG'] },
  { title: 'Translator / Interpreter', description: "Bridges language gaps in business, diplomacy, and media — valuable in Rwanda's multilingual, internationally engaged economy.", sector: 'Arts & Media', combinations: ['HGL', 'KGL', 'KEL'] },
  { title: 'Hotel & Tourism Manager', description: "Manages hospitality operations, drawing on Rwanda's growing tourism industry around its parks and culture.", sector: 'Business', combinations: ['HEG', 'HGL', 'MEG'] },
]

export const seedCareers = async () => {
  for (const career of careers) {
    const existing = await prisma.career.findFirst({ where: { title: career.title } })
    if (!existing) {
      await prisma.career.create({ data: { ...career, isActive: true } })
    }
  }
  console.log(`Seeded ${careers.length} careers.`)
}
