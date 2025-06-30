import React from 'react';

const colors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500',
];

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const Avatar = ({ user, size = 32 }) => {
  if (!user) return null;
  const { name, profilePicture } = user;
  const initial = name ? name[0].toUpperCase() : '?';
  const color = stringToColor(name || '');
  return profilePicture ? (
    <img
      src={`/${profilePicture.replace(/^\/+/, '')}`}
      alt={name}
      className="rounded-full object-cover border border-gray-200"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {initial}
    </div>
  );
};

export default Avatar; 