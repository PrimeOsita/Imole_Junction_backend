const ADJECTIVES = ['Swift', 'Clever', 'Brave', 'Bright', 'Bold', 'Sharp', 'Quick', 'Wise'];
const ANIMALS = ['Leopard', 'Eagle', 'Lion', 'Falcon', 'Panther', 'Tiger', 'Hawk', 'Cheetah'];

function generateAnonymousUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(100 + Math.random() * 900);

  return `${adjective}${animal}${number}`;
}

module.exports = { generateAnonymousUsername };