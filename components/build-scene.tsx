import { ArrowUpRight, BookOpen } from 'lucide-react';
import { AcademyMark } from './brand';
export function BuildScene() {
  return (
    <div
      className="academy-scene"
      aria-label="An open book in Kenya’s colors: learn, build, create"
    >
      <div className="academy-notebook">
        <div className="notebook-top">
          <span>SANAA ACADEMY</span>
          <BookOpen size={18} />
        </div>
        <AcademyMark className="notebook-mark" />
        <div className="notebook-title">
          A little curiosity.
          <br />A world of possibilities.
        </div>
        <div className="notebook-bottom">
          <span>LEARN / BUILD / CREATE</span>
          <ArrowUpRight size={23} />
        </div>
      </div>
      <div className="notebook-note">
        <span className="live-dot" /> Your next chapter starts here.
      </div>
    </div>
  );
}
