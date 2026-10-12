const skills = [
  { slug: 'mental_math', name: 'Mental Math' },
  { slug: 'persuasive_speaking', name: 'Persuasive Speaking' },
  { slug: 'financial_literacy', name: 'Financial Literacy' },
  { slug: 'creative_problem_solving', name: 'Creative Problem-Solving' },
  { slug: 'emotional_intelligence', name: 'Emotional Intelligence' },
];

// Helpers keep the list below easy to read and edit.
const mc = (skill, difficulty, prompt, options, correctAnswer) => ({
  skill,
  type: 'multiple_choice',
  difficulty,
  translations: [{ language: 'en', prompt, options, correctAnswer }],
});

const text = (skill, difficulty, prompt) => ({
  skill,
  type: 'text',
  difficulty,
  translations: [{ language: 'en', prompt }],
});

const challenges = [
  // ---- Mental Math ----
  mc('mental_math', 'easy', 'What is 12 + 15?', ['25', '27', '29', '31'], '27'),
  mc('mental_math', 'easy', 'You buy 3 mangoes at ₦50 each. How much do you pay?', ['₦100', '₦150', '₦200', '₦250'], '₦150'),
  mc('mental_math', 'easy', 'What is 8 × 7?', ['54', '56', '58', '64'], '56'),
  mc('mental_math', 'medium', 'A bus fare is ₦120. How much do 4 friends pay in total?', ['₦380', '₦440', '₦480', '₦520'], '₦480'),
  mc('mental_math', 'medium', 'What is 144 ÷ 12?', ['10', '11', '12', '14'], '12'),
  mc('mental_math', 'hard', 'What is 15% of 200?', ['15', '20', '30', '45'], '30'),

  // ---- Financial Literacy ----
  mc('financial_literacy', 'easy', 'What is a budget?', ['A plan for how you will spend and save your money', 'A type of bank', 'A kind of loan', 'A shop receipt'], 'A plan for how you will spend and save your money'),
  mc('financial_literacy', 'easy', 'Ada gets ₦1,000 pocket money and saves ₦300. How much can she spend?', ['₦500', '₦600', '₦700', '₦800'], '₦700'),
  mc('financial_literacy', 'easy', 'Which one is a NEED rather than a WANT?', ['Food', 'A video game', 'Designer sneakers', 'Sweets'], 'Food'),
  mc('financial_literacy', 'medium', 'Why is it good to save a little money every week?', ['So you can afford bigger goals later', 'Because spending is not allowed', 'So your money never changes', 'There is no reason'], 'So you can afford bigger goals later'),
  mc('financial_literacy', 'medium', 'A bank pays 10% interest a year. You keep ₦1,000 there for one year. How much interest do you earn?', ['₦10', '₦100', '₦1,000', '₦10,000'], '₦100'),
  mc('financial_literacy', 'hard', 'Tunde wants a ₦6,000 football and saves ₦500 every week. How many weeks will it take?', ['10', '12', '14', '16'], '12'),

  // ---- Persuasive Speaking ----
  text('persuasive_speaking', 'easy', 'Convince your friend that reading for 15 minutes a day is worth it. Give two reasons.'),
  text('persuasive_speaking', 'easy', 'Persuade your parents to let you keep a pet. What promises would you make?'),
  text('persuasive_speaking', 'easy', 'You are selling cold zobo drink at school. Write a three-sentence pitch.'),
  text('persuasive_speaking', 'medium', 'Your class wants a longer break. Write a short speech asking your teacher, with two reasons.'),
  text('persuasive_speaking', 'medium', 'Convince your community to keep the street clean. Give one reason and one action people can take.'),
  text('persuasive_speaking', 'hard', 'Argue for or against school uniforms. Pick a side and give three reasons.'),

  // ---- Creative Problem-Solving ----
  text('creative_problem_solving', 'easy', 'The power goes out during class. Name three things you could do to keep learning.'),
  text('creative_problem_solving', 'easy', 'How many different uses can you think of for an empty plastic bottle? List at least five.'),
  text('creative_problem_solving', 'medium', 'The road to your school floods when it rains. Suggest a way to help children get there safely.'),
  text('creative_problem_solving', 'medium', 'Invent a new game that needs only a ball and some chalk. Explain the rules.'),
  text('creative_problem_solving', 'medium', "Your family's market stall is selling less each week. What ideas could help it earn more?"),
  text('creative_problem_solving', 'hard', 'Five students must share one textbook. Design a plan so everyone can study well.'),

  // ---- Emotional Intelligence ----
  text('emotional_intelligence', 'easy', 'Describe a time you felt angry. What did your body feel like, and what helped you calm down?'),
  text('emotional_intelligence', 'easy', 'Your friend is sad because they lost a game. What could you say to help?'),
  text('emotional_intelligence', 'easy', 'Name three feelings you had today and what caused each one.'),
  text('emotional_intelligence', 'medium', 'Someone laughed at you in class. How would you respond calmly?'),
  text('emotional_intelligence', 'medium', 'You and your best friend want different things for a group project. How do you sort it out kindly?'),
  text('emotional_intelligence', 'medium', 'Think of someone who helped you this week. How did it make you feel, and how can you say thank you?'),
];

module.exports = { skills, challenges };