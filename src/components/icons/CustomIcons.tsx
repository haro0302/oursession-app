interface IconProps {
  size?: number;
}

export function BellIcon({ size = 17 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="m6.14 14.969l2.828 2.828a2 2 0 1 1-2.828-2.828m8.867 5.325l-.706.706L3 9.699l.706-.706l1.102.157c.754.108 1.689-.122 2.077-.51l3.885-3.884a5.993 5.993 0 0 1 8.475 8.475l-3.885 3.885c-.388.388-.618 1.323-.51 2.077z" />
    </svg>
  );
}

export function PinIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" fillRule="evenodd">
      <path d="m7.539 14.841l.003.003l.002.002a.755.755 0 0 0 .912 0l.002-.002l.003-.003l.012-.009a6 6 0 0 0 .19-.153a15.6 15.6 0 0 0 2.046-2.082C11.81 11.235 13 9.255 13 7A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.6 15.6 0 0 0 2.046 2.082l.189.153zM8 8.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3" clipRule="evenodd" />
    </svg>
  );
}

export function NoteIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="currentColor">
      <path d="m21.563.17l-11.11 3.399c-1.346.384-2.437 1.788-2.437 3.134v11.719s-.805-.543-2.598-.289C2.785 18.507.65 20.528.65 22.648s2.135 3.419 4.768 3.045c2.635-.372 4.566-2.331 4.566-4.452V11.235c0-.94 1.13-1.343 1.13-1.343l9.823-3.079s1.087-.365 1.087.641v8.037s-1.001-.576-2.794-.358c-2.633.319-4.768 2.298-4.768 4.417c0 2.121 2.135 3.463 4.768 3.143c2.635-.319 4.77-2.297 4.77-4.418V1.912C24 .566 22.908-.214 21.563.17" />
    </svg>
  );
}

export function GuitarIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.848 2.395a1 1 0 0 1 1.219-.171l.866.5a1 1 0 0 1 .461 1.141l-.567 1.982a1 1 0 0 1-1.461.59L15.83 9.096c.92.72 1.37 1.492 1.675 2.211c.223.524.414 1.206.306 1.939c-.115.777-.547 1.48-1.329 2.03c-.504.353-.458.644-.299 1.207c.185.656.524 1.858.148 3.282c-.276 1.043-.943 1.865-1.7 2.41c-.745.538-1.667.872-2.539.827c-1.36-.07-2.749-.41-4.593-1.476c-1.845-1.065-2.834-2.097-3.575-3.24c-.474-.733-.646-1.697-.553-2.611c.094-.929.473-1.917 1.238-2.678c1.045-1.038 2.255-1.346 2.915-1.514c.567-.144.843-.248.897-.862c.085-.952.478-1.677 1.093-2.165c.581-.46 1.268-.636 1.832-.705c.776-.095 1.669-.09 2.752.345l1.535-2.659a1 1 0 0 1-.218-1.56zM10.067 16.08a1 1 0 0 0-1 1.732l.866.5a1 1 0 0 0 1-1.732zm2.683-3.646a1.5 1.5 0 0 0-2.05.548l-.004.01a1.5 1.5 0 0 0 2.598 1.5l.005-.01a1.5 1.5 0 0 0-.55-2.048" />
    </svg>
  );
}

export function SearchIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
      <path d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314" />
    </svg>
  );
}

export function BookmarkIcon({ size = 15, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      {filled ? (
        <path d="M5 21V5q0-.825.588-1.412T7 3h10q.825 0 1.413.588T19 5v16l-7-3z" />
      ) : (
        <path d="M5 21V5q0-.825.588-1.412T7 3h10q.825 0 1.413.588T19 5v16l-7-3zm2-3.05l5-2.15l5 2.15V5H7zM7 5h10z" />
      )}
    </svg>
  );
}

export function MoreIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <circle cx="2.5" cy="8" r=".75" />
      <circle cx="8" cy="8" r=".75" />
      <circle cx="13.5" cy="8" r=".75" />
    </svg>
  );
}

export function SendIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.04 2.323c1.016-.355 1.992.621 1.637 1.637l-5.925 16.93c-.385 1.098-1.915 1.16-2.387.097l-2.859-6.432l4.024-4.025a.75.75 0 0 0-1.06-1.06l-4.025 4.024l-6.432-2.859c-1.063-.473-1-2.002.097-2.387z" />
    </svg>
  );
}

export function HomeIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 19v-9q0-.475.213-.9t.587-.7l6-4.5q.525-.4 1.2-.4t1.2.4l6 4.5q.375.275.588.7T20 10v9q0 .825-.588 1.413T18 21h-3q-.425 0-.712-.288T14 20v-5q0-.425-.288-.712T13 14h-2q-.425 0-.712.288T10 15v5q0 .425-.288.713T9 21H6q-.825 0-1.412-.587T4 19" />
    </svg>
  );
}

export function PlusIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.75c.69 0 1.25.56 1.25 1.25v4.75H18a1.25 1.25 0 1 1 0 2.5h-4.75V18a1.25 1.25 0 1 1-2.5 0v-4.75H6a1.25 1.25 0 1 1 0-2.5h4.75V6c0-.69.56-1.25 1.25-1.25" />
    </svg>
  );
}

export function MessageIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.953 2.25c-2.317 0-4.118 0-5.52.15c-1.418.153-2.541.47-3.437 1.186c-.92.736-1.35 1.693-1.553 2.9c-.193 1.152-.193 2.618-.193 4.446v.183c0 1.782 0 3.015.2 3.934c.108.495.278.925.545 1.323c.264.392.6.722 1.001 1.042c.631.505 1.375.81 2.254 1V21a.75.75 0 0 0 1.123.65c.586-.335 1.105-.7 1.58-1.044l.304-.221a22 22 0 0 1 1.036-.73c.844-.548 1.65-.905 2.707-.905h.047c2.317 0 4.118 0 5.52-.15c1.418-.153 2.541-.47 3.437-1.186c.4-.32.737-.65 1-1.042c.268-.398.438-.828.546-1.323c.2-.919.2-2.152.2-3.934v-.183c0-1.828 0-3.294-.193-4.445c-.203-1.208-.633-2.165-1.553-2.901c-.896-.717-2.019-1.033-3.437-1.185c-1.402-.151-3.203-.151-5.52-.151z" />
    </svg>
  );
}

export function UserIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 22a8 8 0 1 1 16 0zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6" />
    </svg>
  );
}
