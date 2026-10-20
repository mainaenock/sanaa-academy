export function AcademyMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path
        d="M8 35C20 32 30 36 40 43C50 36 60 32 72 35V62C59 60 49 64 40 70C31 64 21 60 8 62V35Z"
        fill="white"
      />
      <path d="M13 40C22 39 30 42 37 47V61C29 56 22 54 13 55V40Z" fill="#BB162B" />
      <path d="M43 47C50 42 58 39 67 40V55C58 54 51 56 43 61V47Z" fill="#078442" />
      <path
        d="M8 62C21 60 31 64 40 70C49 64 59 60 72 62"
        stroke="#161616"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M40 10L70 23L40 36L10 23L40 10Z"
        fill="#161616"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 31V37C33 44 47 44 56 37V31L40 38L24 31Z"
        fill="#161616"
        stroke="white"
        strokeWidth="1.5"
      />
      <path d="M69 24V40" stroke="#BB162B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
export function Logo({
  href = '/',
  text = 'sanaa',
  image,
}: {
  href?: string;
  text?: string;
  image?: string;
}) {
  return (
    <a className="logo" href={href} aria-label="Sanaa Academy home">
      {image ? (
        <img className="logo-mark" src={image} alt="" />
      ) : (
        <AcademyMark className="logo-mark" />
      )}
      <span className="logo-name">
        {text}
        <small>ACADEMY</small>
      </span>
    </a>
  );
}
