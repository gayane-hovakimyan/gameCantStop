// makeAvatarSVG(gender, team, skin, uid)
function makeAvatarSVG(gender, team, skin, uid) {
  uid  = uid  || 'x';
  skin = skin || 'light';

  // European skin palette — highlight / base / mid / shadow / lip
  const SK = {
    light:  { hi:'#fde8cc', base:'#f5cfa0', mid:'#dfa060', dark:'#a87038', shadow:'rgba(120,65,20,0.22)', lip:'#d05878',
              irisHi:'#a0c890', irisMid:'#5a9050', irisDark:'#2e6828', irisDeep:'#1a4018' },
    medium: { hi:'#e8b880', base:'#d49058', mid:'#b07038', dark:'#804820', shadow:'rgba(80,40,10,0.22)', lip:'#b04868',
              irisHi:'#c09050', irisMid:'#8c5820', irisDark:'#5c3410', irisDeep:'#301a08' },
    dark:   { hi:'#a87050', base:'#8c5530', mid:'#6c3e1e', dark:'#4c2a0e', shadow:'rgba(30,15,5,0.25)', lip:'#883040',
              irisHi:'#9c7040', irisMid:'#6e4418', irisDark:'#4a2c0a', irisDeep:'#281408' },
  };
  const sk = SK[skin] || SK.light;
  const tc  = team === 1 ? '#3b82f6' : '#ef4444';
  const tc2 = team === 1 ? '#1a4fbd' : '#b41414';
  const tc3 = team === 1 ? '#0d3a9e' : '#8a0e0e';

  return gender === 'female'
    ? femaleSVG(sk, tc, tc2, tc3, uid)
    : maleSVG(sk, tc, tc2, tc3, uid);
}

// ── REALISTIC HAND — natural proportions, tapered fingers ────────────────────
function realisticHand(sk, sleeveColor, uid) {
  return `
<g class="hand-signal">
  <!-- Sleeve shadow + sleeve -->
  <path fill="${sk.dark}" opacity="0.15" d="M77,73 Q80,83 79,93 Q74,97 68,95Z"/>
  <path fill="${sleeveColor}" d="M76,72 Q79,82 78,92 Q73,96 67,94 Q68,83 72,73Z"/>
  <!-- Wrist (skin) -->
  <path fill="url(#sg${uid})" d="M62,92 Q65,89 72,88.5 Q78,89 79.5,92 Q78,96 71,97.5 Q64,96 62,92Z"/>
  <!-- Palm shadow for depth -->
  <path fill="${sk.dark}" opacity="0.1" d="M63,93 Q66,96 71,97 Q76,96 79,93 Q76,97 71,98.5 Q66,97 63,93Z"/>

  <!-- Pinky (shortest) — slight inward angle -->
  <path fill="url(#sg${uid})" d="M63.5,91.5 Q63,88.5 63.5,85.5 Q64.2,83.5 65.5,84 Q66.5,85 66.2,88 Q66,91 65.5,91.5Z"/>
  <!-- Ring finger -->
  <path fill="url(#sg${uid})" d="M66.5,91 Q66,87 66.5,83.5 Q67.3,81.5 68.8,82 Q70,83 69.7,86.5 Q69.4,90 69,91Z"/>
  <!-- Middle finger (tallest) -->
  <path fill="url(#sg${uid})" d="M70,90.5 Q69.5,86 70,82.5 Q70.8,80.5 72.3,81 Q73.5,82 73.2,85.5 Q72.9,89.5 72.5,90.5Z"/>
  <!-- Index finger -->
  <path fill="url(#sg${uid})" d="M73.5,91 Q73,87 73.5,83.5 Q74.3,81.5 75.8,82 Q77,83.2 76.7,86.5 Q76.4,90 76,91Z"/>
  <!-- Thumb — along the side -->
  <path fill="url(#sg${uid})" d="M62,93.5 Q60,90.5 61.2,87.5 Q62.5,85.5 64.5,86.5 Q65,89 64,92.5Z"/>

  <!-- Inter-finger gaps (shadow lines) -->
  <line stroke="${sk.dark}" stroke-width="0.9" opacity="0.3" stroke-linecap="round" x1="66.2" y1="91" x2="66.5" y2="84"/>
  <line stroke="${sk.dark}" stroke-width="0.9" opacity="0.3" stroke-linecap="round" x1="69.5" y1="90.5" x2="70"   y2="83"/>
  <line stroke="${sk.dark}" stroke-width="0.9" opacity="0.3" stroke-linecap="round" x1="73"   y1="91"   x2="73.5" y2="83.5"/>

  <!-- Knuckle row arc -->
  <path fill="none" stroke="${sk.dark}" stroke-width="0.55" opacity="0.28" stroke-linecap="round"
    d="M64.5,90.5 Q67.5,89.5 71,89 Q74,89 76,90"/>

  <!-- Nail highlights (oval on each fingertip) -->
  <ellipse fill="rgba(255,242,230,0.55)" cx="64.8" cy="84.5" rx="0.75" ry="1.0"/>
  <ellipse fill="rgba(255,242,230,0.55)" cx="68"   cy="82.5" rx="0.75" ry="1.0"/>
  <ellipse fill="rgba(255,242,230,0.55)" cx="71.5" cy="81.5" rx="0.75" ry="1.0"/>
  <ellipse fill="rgba(255,242,230,0.55)" cx="75"   cy="82.5" rx="0.75" ry="1.0"/>
</g>`;
}

// ── SHARED FACE ELEMENTS ──────────────────────────────────────────────────────
function sharedDefs(sk, uid) {
  return `
  <!-- Skin gradient — warm center, natural edge shading -->
  <radialGradient id="sg${uid}" cx="44%" cy="28%" r="76%">
    <stop offset="0%"   stop-color="${sk.hi}"/>
    <stop offset="30%"  stop-color="${sk.base}"/>
    <stop offset="72%"  stop-color="${sk.mid}"/>
    <stop offset="100%" stop-color="${sk.dark}"/>
  </radialGradient>
  <!-- Eye iris gradient — green-hazel for light skin, brown for medium/dark -->
  <radialGradient id="iris${uid}" cx="38%" cy="32%" r="68%">
    <stop offset="0%"   stop-color="${sk.irisHi}"/>
    <stop offset="35%"  stop-color="${sk.irisMid}"/>
    <stop offset="70%"  stop-color="${sk.irisDark}"/>
    <stop offset="100%" stop-color="${sk.irisDeep}"/>
  </radialGradient>
  <!-- Lip gradient -->
  <radialGradient id="lip${uid}" cx="50%" cy="35%" r="65%">
    <stop offset="0%"   stop-color="${sk.lip}"/>
    <stop offset="100%" stop-color="${sk.dark}"/>
  </radialGradient>`;
}

// Realistic almond eyes — smaller, natural proportions
function realisticEyes(browCol, uid, female) {
  const eyeShadow = female ? 'rgba(80,50,120,0.12)' : 'rgba(60,40,20,0.07)';
  const lashW = female ? '0.95' : '0.8';
  // Left eye: 9.5 units wide, center x=31, y=32-37
  // Right eye: 9.5 units wide, center x=49, y=32-37
  return `
<!-- ── EYES ── -->
<!-- Left eye socket shadow -->
<path fill="${eyeShadow}" d="M26,33.5 Q28.5,29.5 31,30 Q33.5,29.5 36,33.5 Q33.5,37 31,37.5 Q28.5,37 26,33.5Z"/>
<!-- Left eye white -->
<path fill="#f8f9ff" d="M26.5,33.5 Q29,30.5 31,31 Q33,30.5 35.5,33.5 Q33,36.5 31,37 Q29,36.5 26.5,33.5Z"/>
<!-- Left iris -->
<circle fill="url(#iris${uid})" cx="31" cy="33.5" r="2.5"/>
<!-- Left pupil -->
<circle fill="#0c0810" cx="31" cy="33.5" r="1.55"/>
<!-- Catchlights left -->
<circle fill="rgba(255,255,255,0.92)" cx="32"   cy="32.5" r="0.72"/>
<circle fill="rgba(255,255,255,0.35)" cx="30"   cy="34.6" r="0.36"/>
<!-- Left upper eyelid -->
<path fill="none" stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round"
  d="M26.5,33.5 Q29,30.5 31,30.5 Q33,30.5 35.5,33.5"/>
<!-- Left lower lid -->
<path fill="none" stroke="${browCol}" stroke-width="0.5" opacity="0.38" stroke-linecap="round"
  d="M27,34 Q29.5,37 31,37 Q32.5,37 35,34"/>
<!-- Left upper lashes (5) -->
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="26.5" y1="33.5" x2="25.5" y2="32"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="28.5" y1="31"   x2="28"   y2="29.5"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="31"   y1="30.5" x2="31"   y2="29"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="33.5" y1="31"   x2="34"   y2="29.5"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="35.5" y1="33.5" x2="36.5" y2="32"/>

<!-- Right eye socket shadow -->
<path fill="${eyeShadow}" d="M44,33.5 Q46.5,29.5 49,30 Q51.5,29.5 54,33.5 Q51.5,37 49,37.5 Q46.5,37 44,33.5Z"/>
<!-- Right eye white -->
<path fill="#f8f9ff" d="M44.5,33.5 Q47,30.5 49,31 Q51,30.5 53.5,33.5 Q51,36.5 49,37 Q47,36.5 44.5,33.5Z"/>
<!-- Right iris -->
<circle fill="url(#iris${uid})" cx="49" cy="33.5" r="2.5"/>
<!-- Right pupil -->
<circle fill="#0c0810" cx="49" cy="33.5" r="1.55"/>
<!-- Catchlights right -->
<circle fill="rgba(255,255,255,0.92)" cx="50"   cy="32.5" r="0.72"/>
<circle fill="rgba(255,255,255,0.35)" cx="48"   cy="34.6" r="0.36"/>
<!-- Right upper eyelid -->
<path fill="none" stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round"
  d="M44.5,33.5 Q47,30.5 49,30.5 Q51,30.5 53.5,33.5"/>
<!-- Right lower lid -->
<path fill="none" stroke="${browCol}" stroke-width="0.5" opacity="0.38" stroke-linecap="round"
  d="M45,34 Q47.5,37 49,37 Q50.5,37 53,34"/>
<!-- Right upper lashes (5) -->
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="44.5" y1="33.5" x2="43.5" y2="32"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="46.5" y1="31"   x2="46"   y2="29.5"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="49"   y1="30.5" x2="49"   y2="29"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="51.5" y1="31"   x2="52"   y2="29.5"/>
<line stroke="${browCol}" stroke-width="${lashW}" stroke-linecap="round" x1="53.5" y1="33.5" x2="54.5" y2="32"/>`;
}

// Realistic nose with bridge, tip, nostrils — narrower, proportionate
function realisticNose(sk) {
  return `
<!-- ── NOSE ── -->
<!-- Bridge shadows (from inner eye corners downward) -->
<path fill="none" stroke="${sk.dark}" stroke-width="0.85" opacity="0.32" stroke-linecap="round"
  d="M37.5,39 C37,42 36.8,45 37,48.5"/>
<path fill="none" stroke="${sk.dark}" stroke-width="0.85" opacity="0.32" stroke-linecap="round"
  d="M42.5,39 C43,42 43.2,45 43,48.5"/>
<!-- Nose tip highlight -->
<ellipse fill="${sk.hi}" cx="40" cy="49.5" rx="2.2" ry="1.8" opacity="0.48"/>
<!-- Nostril wings -->
<path fill="${sk.dark}" opacity="0.28"
  d="M35,51 Q37,53 38.5,52.5 Q39.5,53.5 40,53 Q40.5,53.5 41.5,52.5 Q43,53 45,51
  Q43,54.5 40,53.5 Q37,54.5 35,51Z"/>
<!-- Nostril openings -->
<ellipse fill="${sk.dark}" cx="37.5" cy="51.5" rx="1.5" ry="1.2" opacity="0.4"/>
<ellipse fill="${sk.dark}" cx="42.5" cy="51.5" rx="1.5" ry="1.2" opacity="0.4"/>
<!-- Nose bridge highlight -->
<path fill="${sk.hi}" opacity="0.22" d="M39.5,39 Q40.5,43.5 40.5,48 Q40,43.5 39.5,39Z"/>`;
}

// Realistic lips — proportionate, 10 units wide (x=35–45), symmetric
function realisticLips(sk, uid) {
  const L1 = sk.lip;
  return `
<!-- ── LIPS ── -->
<!-- Philtrum shadow -->
<path fill="${sk.dark}" opacity="0.15"
  d="M39,55.5 Q39.5,54.5 40,54 Q40.5,54.5 41,55.5 Q40.5,56 40,56 Q39.5,56 39,55.5Z"/>
<!-- Upper lip — Cupid's bow (x=35–45) -->
<path fill="${L1}"
  d="M35,58
  C36.5,55.5 38,54.5 39,55
  Q39.5,54 40,53.5
  Q40.5,54 41,55
  C42,54.5 43.5,55.5 45,58
  Q43,57.2 41.5,57 Q40.6,56.4 40,57.2
  Q39.4,56.4 38.5,57 Q37,57.2 35,58Z"/>
<!-- Lower lip -->
<path fill="${L1}" opacity="0.9"
  d="M35,58 Q37.5,61.5 40,62.5 Q42.5,61.5 45,58
  Q44,64.5 42,65.5 Q41,66 40,66
  Q39,66 38,65.5 Q36,64.5 35,58Z"/>
<!-- Lip parting line -->
<path fill="none" stroke="${sk.dark}" stroke-width="0.75" opacity="0.48" stroke-linecap="round"
  d="M35,58 C37,56.5 38.5,55.2 39.5,55 Q40,54.2 40,53.5 Q40,54.2 40.5,55 C41.5,55.2 43,56.5 45,58"/>
<!-- Lower lip highlight -->
<path fill="rgba(255,215,225,0.4)"
  d="M37,59.8 Q40,62.8 43,59.8 Q41.8,62.2 40,63 Q38.2,62.2 37,59.8Z"/>
<!-- Cupid bow centre shine -->
<path fill="rgba(255,225,235,0.28)"
  d="M39.5,55 Q40,54.2 40.5,55 Q40,55.8 39.5,55Z"/>
<!-- Corner shadows -->
<circle fill="${sk.dark}" cx="35.3" cy="58.2" r="1.0" opacity="0.18"/>
<circle fill="${sk.dark}" cx="44.7" cy="58.2" r="1.0" opacity="0.18"/>`;
}

// ── FEMALE (European, Angelina Jolie inspired) ──────────────────────────────
function femaleSVG(sk, tc, tc2, tc3, uid) {
  const HR  = '#0e0808';
  const HR2 = '#1e1010';
  const HR3 = '#381818';

  return `<svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
<defs>${sharedDefs(sk, uid)}</defs>

<!-- Table -->
<rect fill="#164f3b" x="0" y="84" width="80" height="4"/>
<rect fill="#1a5840" x="0" y="88" width="80" height="22"/>

<!-- ── BODY — white blouse ── -->
<path fill="#c8ccec" d="M0,110 L5,70 Q12,60 40,57 Q68,60 75,70 L80,110Z"/>
<path fill="#dde0f5" d="M2,110 L7,72 Q14,63 40,60 Q66,63 73,72 L78,110Z"/>
<path fill="#eef0ff" d="M4,110 L9,75 Q17,66 40,63 Q63,66 71,75 L76,110Z"/>
<path fill="${sk.dark}" opacity="0.18" d="M36,64 Q38,72 40,76 Q42,72 44,64Z"/>
<path fill="${sk.base}" d="M35,62 Q37,71 40,75 Q43,71 45,62 Q42,56 40,55 Q38,56 35,62Z"/>
<path fill="${sk.dark}" opacity="0.14" d="M35,62 Q40,66.5 45,62 L45,65 Q40,69.5 35,65Z"/>
<rect fill="${tc}" x="2" y="90" width="76" height="5.5" opacity="0.7" rx="2"/>

<!-- Left arm on table -->
<path fill="${sk.dark}" opacity="0.18" d="M7,75 Q3,84 3,93 Q10,97 17,95 Q15,84 13,76Z"/>
<path fill="#dde0f5" d="M7,74 Q3,82 3,92 Q10,96 16,94 Q14,83 11,74Z"/>
<!-- Left hand resting on table -->
<path fill="url(#sg${uid})" d="M0.5,92 Q3,89 10,88.5 Q16,89 17.5,92 Q16,96 9.5,97.5 Q3,96 0.5,92Z"/>
<!-- Pinky -->
<path fill="url(#sg${uid})" d="M2,91.5 Q1.5,88.5 2,85.5 Q2.8,83.5 4.2,84 Q5.2,85 4.9,88 Q4.6,91 4.2,91.5Z"/>
<!-- Ring -->
<path fill="url(#sg${uid})" d="M5.2,91 Q4.7,87 5.2,83.5 Q6,81.5 7.5,82 Q8.7,83 8.4,86.5 Q8.1,90 7.7,91Z"/>
<!-- Middle -->
<path fill="url(#sg${uid})" d="M8.7,90.5 Q8.2,86 8.7,82.5 Q9.5,80.5 11,81 Q12.2,82 11.9,85.5 Q11.6,89.5 11.2,90.5Z"/>
<!-- Index -->
<path fill="url(#sg${uid})" d="M12.2,91 Q11.7,87 12.2,83.5 Q13,81.5 14.5,82 Q15.7,83.2 15.4,86.5 Q15.1,90 14.7,91Z"/>
<!-- Thumb -->
<path fill="url(#sg${uid})" d="M0.5,93.5 Q-1.2,90.5 0,87.5 Q1.3,85.5 3.2,86.5 Q3.7,89 2.7,92.5Z"/>
<!-- Finger gaps -->
<line stroke="${sk.dark}" stroke-width="0.8" opacity="0.28" stroke-linecap="round" x1="4.8" y1="91" x2="5.2" y2="84"/>
<line stroke="${sk.dark}" stroke-width="0.8" opacity="0.28" stroke-linecap="round" x1="8.2" y1="90.5" x2="8.7" y2="83"/>
<line stroke="${sk.dark}" stroke-width="0.8" opacity="0.28" stroke-linecap="round" x1="11.7" y1="91" x2="12.2" y2="83.5"/>
<!-- Knuckle arc -->
<path fill="none" stroke="${sk.dark}" stroke-width="0.5" opacity="0.25" stroke-linecap="round"
  d="M3.2,90.5 Q6.2,89.5 9.7,89 Q12.7,89 14.7,90"/>
<!-- Nail highlights -->
<ellipse fill="rgba(255,242,230,0.5)" cx="3.5" cy="84.5" rx="0.7" ry="0.95"/>
<ellipse fill="rgba(255,242,230,0.5)" cx="6.7" cy="82.5" rx="0.7" ry="0.95"/>
<ellipse fill="rgba(255,242,230,0.5)" cx="10.2" cy="81.5" rx="0.7" ry="0.95"/>
<ellipse fill="rgba(255,242,230,0.5)" cx="13.7" cy="82.5" rx="0.7" ry="0.95"/>

<!-- ── LONG DARK HAIR (behind face) ── -->
<!-- Main flowing hair body -->
<path fill="${HR}" d="
  M40,8 C28,8 17,14 15,27
  C13,38 13,50 15,60
  Q12,68 11,80 Q11,88 12,90 L20,90
  Q19,86 20,78 Q21,68 22,62
  C20,52 19,41 21,30
  C24,18 31,12 40,12
  C49,12 56,18 59,30
  C61,41 60,52 58,62
  Q59,68 60,78 Q61,86 60,90 L68,90
  Q69,88 68,80 Q67,68 65,60
  C67,50 67,38 65,27
  C63,14 52,8 40,8Z"/>
<!-- Hair depth / inner volume highlights -->
<path fill="${HR2}" d="M14,35 C12,44 12,54 14,62 Q14,54 15,44 C16,36 17,28 20,21 C17,24 15,29 14,35Z"/>
<path fill="${HR2}" d="M66,35 C68,44 68,54 66,62 Q66,54 65,44 C64,36 63,28 60,21 C63,24 65,29 66,35Z"/>
<!-- Hair wave texture strands (natural flow) -->
<path fill="none" stroke="${HR3}" stroke-width="1.8" stroke-linecap="round" opacity="0.55"
  d="M13,32 Q11,44 12,56"/>
<path fill="none" stroke="${HR3}" stroke-width="1.8" stroke-linecap="round" opacity="0.55"
  d="M67,32 Q69,44 68,56"/>
<path fill="none" stroke="${HR3}" stroke-width="1.2" stroke-linecap="round" opacity="0.35"
  d="M14,42 Q13,52 14,60"/>
<path fill="none" stroke="${HR3}" stroke-width="1.2" stroke-linecap="round" opacity="0.35"
  d="M66,42 Q67,52 66,60"/>

<!-- ── FACE ── -->
<path fill="${sk.dark}" opacity="0.16" d="M40,13 C28,13 20,21 19,33 C18,45 20,55 27,62 C32,67 36,70 40,71 C44,70 48,67 53,62 C60,55 62,45 61,33 C60,21 52,13 40,13Z"/>
<path fill="url(#sg${uid})" d="M40,14 C29,14 22,22 21,33 C20,45 22,55 28,62 C33,67 37,70 40,71 C43,70 47,67 52,62 C58,55 60,45 59,33 C58,22 51,14 40,14Z"/>

<!-- Face contouring: cheekbones, jaw, temples -->
<path fill="${sk.dark}" opacity="0.1" d="M19,44 Q21,34 29,32 Q23,40 22,52Z"/>
<path fill="${sk.dark}" opacity="0.1" d="M61,44 Q59,34 51,32 Q57,40 58,52Z"/>
<path fill="${sk.dark}" opacity="0.08" d="M26,62 Q29,68 40,71 Q51,68 54,62 Q50,68 40,70 Q30,68 26,62Z"/>
<!-- Cheek blush (subtle) -->
<ellipse fill="rgba(218,100,100,0.1)" cx="23" cy="47" rx="7" ry="4.5"/>
<ellipse fill="rgba(218,100,100,0.1)" cx="57" cy="47" rx="7" ry="4.5"/>
<!-- Temple shadow -->
<ellipse fill="${sk.dark}" cx="20" cy="28" rx="4" ry="6" opacity="0.08"/>
<ellipse fill="${sk.dark}" cx="60" cy="28" rx="4" ry="6" opacity="0.08"/>

<!-- ── HAIR FRONT (over face edges — framing) ── -->
<path fill="${HR}" d="M19,27 C17,34 16,42 16,50 C17,58 18,64 19,68 C20,62 20,54 21,46 C22,38 22,30 24,23 C22,24 20,25 19,27Z"/>
<path fill="${HR}" d="M61,27 C63,34 64,42 64,50 C63,58 62,64 61,68 C60,62 60,54 59,46 C58,38 58,30 56,23 C58,24 60,25 61,27Z"/>
<!-- Crown hair detail -->
<path fill="${HR}" d="M40,8 C35,8 31,9 28,11 Q32,9 40,9 Q48,9 52,11 C49,9 45,8 40,8Z"/>

<!-- Ears (partially hidden by hair) -->
<path fill="${sk.mid}" d="M20,34 C18,32 16,35 16,38 C16,41 18,43 20,42 Q19,38 19,35Z"/>
<path fill="${sk.dark}" opacity="0.2" d="M18,35 Q16,38 18,41 Q20,42 21,41 Q19,38 19,36Z"/>
<path fill="${sk.mid}" d="M60,34 C62,32 64,35 64,38 C64,41 62,43 60,42 Q61,38 61,35Z"/>
<path fill="${sk.dark}" opacity="0.2" d="M62,35 Q64,38 62,41 Q60,42 59,41 Q61,38 61,36Z"/>

<!-- ── EYEBROWS — arched, defined (natural hair strokes) ── -->
<!-- Left brow: above left eye (x=25–37) -->
<g class="brow-l">
  <path fill="${HR}" opacity="0.88" d="M24,28.5 Q28,24 34.5,25.5 Q29,23 24,28.5Z"/>
  <line stroke="${HR}" stroke-width="0.9" stroke-linecap="round" x1="24.5" y1="28"   x2="25.8" y2="25.8"/>
  <line stroke="${HR}" stroke-width="1.0" stroke-linecap="round" x1="26.5" y1="26.5" x2="27.8" y2="24.5"/>
  <line stroke="${HR}" stroke-width="1.1" stroke-linecap="round" x1="28.5" y1="25.5" x2="29.8" y2="23.5"/>
  <line stroke="${HR}" stroke-width="1.1" stroke-linecap="round" x1="30.5" y1="25"   x2="31.5" y2="23.2"/>
  <line stroke="${HR}" stroke-width="1.0" stroke-linecap="round" x1="32.5" y1="25.5" x2="33.2" y2="24"/>
  <line stroke="${HR}" stroke-width="0.9" stroke-linecap="round" x1="34.5" y1="26.5" x2="35"   y2="25"/>
</g>
<!-- Right brow: above right eye (x=43–55) -->
<g class="brow-r">
  <path fill="${HR}" opacity="0.88" d="M45.5,25.5 Q52,24 56,28.5 Q51,23 45.5,25.5Z"/>
  <line stroke="${HR}" stroke-width="0.9" stroke-linecap="round" x1="45.5" y1="26.5" x2="45"   y2="25"/>
  <line stroke="${HR}" stroke-width="1.0" stroke-linecap="round" x1="47.5" y1="25.5" x2="46.8" y2="24"/>
  <line stroke="${HR}" stroke-width="1.1" stroke-linecap="round" x1="49.5" y1="25"   x2="48.5" y2="23.2"/>
  <line stroke="${HR}" stroke-width="1.1" stroke-linecap="round" x1="51.5" y1="25.5" x2="50.2" y2="23.5"/>
  <line stroke="${HR}" stroke-width="1.0" stroke-linecap="round" x1="53.5" y1="26.5" x2="52.2" y2="24.5"/>
  <line stroke="${HR}" stroke-width="0.9" stroke-linecap="round" x1="55.5" y1="28"   x2="54.2" y2="25.8"/>
</g>

${realisticEyes(HR, uid, true)}
${realisticNose(sk)}
${realisticLips(sk, uid)}

<!-- Right hand (signal animation) -->
${realisticHand(sk, '#dde0f5', uid)}
</svg>`;
}

// ── MALE (European, Brad Pitt inspired) ──────────────────────────────────────
function maleSVG(sk, tc, tc2, tc3, uid) {
  const HR  = '#6a4818';   // sandy/dirty-blonde
  const HR2 = '#4e3210';   // darker hair depth
  const HR3 = '#8a6030';   // lighter highlight

  return `<svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
<defs>${sharedDefs(sk, uid)}</defs>

<!-- Table -->
<rect fill="#164f3b" x="0" y="84" width="80" height="4"/>
<rect fill="#1a5840" x="0" y="88" width="80" height="22"/>

<!-- ── BODY — team shirt ── -->
<path fill="${tc3}" d="M0,110 L5,70 Q12,60 40,57 Q68,60 75,70 L80,110Z"/>
<path fill="${tc2}" d="M2,110 L7,72 Q14,63 40,60 Q66,63 73,72 L78,110Z"/>
<path fill="${tc}"  d="M4,110 L9,75 Q17,66 40,63 Q63,66 71,75 L76,110Z"/>
<path fill="${sk.dark}" opacity="0.16" d="M36,64 Q38,72 40,76 Q42,72 44,64Z"/>
<path fill="${sk.base}" d="M35,62 Q37,71 40,75 Q43,71 45,62 Q42,56 40,55 Q38,56 35,62Z"/>
<path fill="${sk.dark}" opacity="0.14" d="M35,62 Q40,66.5 45,62 L45,65 Q40,69.5 35,65Z"/>

<!-- Left arm -->
<path fill="${sk.dark}" opacity="0.18" d="M7,75 Q3,84 3,93 Q10,97 17,95 Q15,84 13,76Z"/>
<path fill="${tc}" d="M7,74 Q3,82 3,92 Q10,96 16,94 Q14,83 11,74Z"/>
<!-- Left hand resting on table -->
<path fill="url(#sg${uid})" d="M0.5,92 Q3,89 10,88.5 Q16,89 17.5,92 Q16,96 9.5,97.5 Q3,96 0.5,92Z"/>
<!-- Pinky -->
<path fill="url(#sg${uid})" d="M2,91.5 Q1.5,88.5 2,85.5 Q2.8,83.5 4.2,84 Q5.2,85 4.9,88 Q4.6,91 4.2,91.5Z"/>
<!-- Ring -->
<path fill="url(#sg${uid})" d="M5.2,91 Q4.7,87 5.2,83.5 Q6,81.5 7.5,82 Q8.7,83 8.4,86.5 Q8.1,90 7.7,91Z"/>
<!-- Middle -->
<path fill="url(#sg${uid})" d="M8.7,90.5 Q8.2,86 8.7,82.5 Q9.5,80.5 11,81 Q12.2,82 11.9,85.5 Q11.6,89.5 11.2,90.5Z"/>
<!-- Index -->
<path fill="url(#sg${uid})" d="M12.2,91 Q11.7,87 12.2,83.5 Q13,81.5 14.5,82 Q15.7,83.2 15.4,86.5 Q15.1,90 14.7,91Z"/>
<!-- Thumb -->
<path fill="url(#sg${uid})" d="M0.5,93.5 Q-1.2,90.5 0,87.5 Q1.3,85.5 3.2,86.5 Q3.7,89 2.7,92.5Z"/>
<!-- Finger gaps -->
<line stroke="${sk.dark}" stroke-width="0.8" opacity="0.28" stroke-linecap="round" x1="4.8" y1="91" x2="5.2" y2="84"/>
<line stroke="${sk.dark}" stroke-width="0.8" opacity="0.28" stroke-linecap="round" x1="8.2" y1="90.5" x2="8.7" y2="83"/>
<line stroke="${sk.dark}" stroke-width="0.8" opacity="0.28" stroke-linecap="round" x1="11.7" y1="91" x2="12.2" y2="83.5"/>
<!-- Knuckle arc -->
<path fill="none" stroke="${sk.dark}" stroke-width="0.5" opacity="0.25" stroke-linecap="round"
  d="M3.2,90.5 Q6.2,89.5 9.7,89 Q12.7,89 14.7,90"/>
<!-- Nail highlights -->
<ellipse fill="rgba(255,242,230,0.5)" cx="3.5" cy="84.5" rx="0.7" ry="0.95"/>
<ellipse fill="rgba(255,242,230,0.5)" cx="6.7" cy="82.5" rx="0.7" ry="0.95"/>
<ellipse fill="rgba(255,242,230,0.5)" cx="10.2" cy="81.5" rx="0.7" ry="0.95"/>
<ellipse fill="rgba(255,242,230,0.5)" cx="13.7" cy="82.5" rx="0.7" ry="0.95"/>

<!-- ── FACE — square jaw (Brad Pitt) ── -->
<path fill="${sk.dark}" opacity="0.18" d="M40,13 C29,13 20,20 19,31 C18,43 20,53 26,60 C30,65 35,68 40,69 C45,68 50,65 54,60 C60,53 62,43 61,31 C60,20 51,13 40,13Z"/>
<path fill="url(#sg${uid})" d="M40,14 C30,14 22,21 21,31 C20,43 22,53 27,60 C31,65 36,68 40,69 C44,68 49,65 53,60 C58,53 60,43 59,31 C58,21 50,14 40,14Z"/>

<!-- Strong jaw definition (Brad's square jaw) -->
<path fill="${sk.dark}" opacity="0.15" d="M21,52 Q24,64 40,67 Q56,64 59,52 Q55,63 52,65 Q46,69 40,70 Q34,69 28,65 Q25,63 21,52Z"/>
<!-- Cheekbones -->
<path fill="${sk.dark}" opacity="0.1" d="M20,43 Q22,33 30,31 Q24,39 23,51Z"/>
<path fill="${sk.dark}" opacity="0.1" d="M60,43 Q58,33 50,31 Q56,39 57,51Z"/>
<!-- Brow bone shadow (masculine depth) -->
<ellipse fill="${sk.dark}" cx="30" cy="26" rx="7" ry="4" opacity="0.1"/>
<ellipse fill="${sk.dark}" cx="50" cy="26" rx="7" ry="4" opacity="0.1"/>

<!-- ── HAIR — short sandy tousled (Brad Pitt) ── -->
<path fill="${HR2}" d="M40,11 C28,11 19,17 18,27 Q18,17 40,13 Q62,17 62,27 C61,17 52,11 40,11Z"/>
<path fill="${HR}" d="M22,25 C22,14 27,10 40,10 C53,10 58,14 58,25 C55,15 50,12 40,12 C30,12 25,15 22,25Z"/>
<path fill="${HR2}" d="M21,25 C19,23 17,27 17,30 C17,34 19,36 21,37 C21,33 21,28 21,26Z"/>
<path fill="${HR2}" d="M59,25 C61,23 63,27 63,30 C63,34 61,36 59,37 C59,33 59,28 59,26Z"/>
<!-- Tousled texture strokes (natural hair) -->
<path fill="none" stroke="${HR3}" stroke-width="2.0" stroke-linecap="round" opacity="0.6"
  d="M26,18 Q33,13 40,12 Q47,13 54,18"/>
<path fill="none" stroke="${HR}" stroke-width="1.5" stroke-linecap="round" opacity="0.45"
  d="M24,22 Q29,16 40,15 Q51,16 56,22"/>
<path fill="none" stroke="${HR2}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"
  d="M22,26 Q27,20 35,17 Q40,16 45,17 Q53,20 58,26"/>
<!-- Tuft texture highlights -->
<path fill="none" stroke="${HR3}" stroke-width="1.0" stroke-linecap="round" opacity="0.4"
  d="M33,15 Q37,12 40,12 Q43,12 47,15"/>
<path fill="none" stroke="${HR3}" stroke-width="0.8" stroke-linecap="round" opacity="0.3"
  d="M30,18 Q35,14 40,14 Q45,14 50,18"/>

<!-- Ears -->
<path fill="${sk.mid}" d="M20,33 C18,31 16,34 16,37 C16,40 18,42 20,41 Q19,37 19,34Z"/>
<path fill="${sk.dark}" opacity="0.2" d="M18,34 Q16,37 18,40 Q20,42 21,41 Q19,37 19,35Z"/>
<path fill="${sk.mid}" d="M60,33 C62,31 64,34 64,37 C64,40 62,42 60,41 Q61,37 61,34Z"/>
<path fill="${sk.dark}" opacity="0.2" d="M62,34 Q64,37 62,40 Q60,42 59,41 Q61,37 61,35Z"/>

<!-- ── EYEBROWS — medium, natural strokes (Brad Pitt) ── -->
<!-- Left brow: above left eye (x=25–37) -->
<g class="brow-l">
  <path fill="${HR2}" opacity="0.85" d="M24.5,27.5 Q29,23.5 35,25.2 Q29,22.5 24.5,27.5Z"/>
  <line stroke="${HR2}" stroke-width="1.1" stroke-linecap="round" x1="25"   y1="27.5" x2="26.2" y2="25.2"/>
  <line stroke="${HR2}" stroke-width="1.3" stroke-linecap="round" x1="27"   y1="26"   x2="28.2" y2="23.8"/>
  <line stroke="${HR2}" stroke-width="1.4" stroke-linecap="round" x1="29.5" y1="25"   x2="30.2" y2="23"/>
  <line stroke="${HR2}" stroke-width="1.4" stroke-linecap="round" x1="31.5" y1="25"   x2="32"   y2="23.2"/>
  <line stroke="${HR2}" stroke-width="1.3" stroke-linecap="round" x1="33.5" y1="25.8" x2="34"   y2="24"/>
  <line stroke="${HR2}" stroke-width="1.0" stroke-linecap="round" x1="35.5" y1="27"   x2="35.8" y2="25.5"/>
</g>
<!-- Right brow: above right eye (x=43–55) -->
<g class="brow-r">
  <path fill="${HR2}" opacity="0.85" d="M45,25.2 Q51,23.5 55.5,27.5 Q51,22.5 45,25.2Z"/>
  <line stroke="${HR2}" stroke-width="1.0" stroke-linecap="round" x1="45"   y1="26.5" x2="44.2" y2="25"/>
  <line stroke="${HR2}" stroke-width="1.3" stroke-linecap="round" x1="47"   y1="25.8" x2="46"   y2="24"/>
  <line stroke="${HR2}" stroke-width="1.4" stroke-linecap="round" x1="49"   y1="25"   x2="48"   y2="23.2"/>
  <line stroke="${HR2}" stroke-width="1.4" stroke-linecap="round" x1="51"   y1="25"   x2="49.8" y2="23"/>
  <line stroke="${HR2}" stroke-width="1.3" stroke-linecap="round" x1="53"   y1="26"   x2="51.8" y2="23.8"/>
  <line stroke="${HR2}" stroke-width="1.1" stroke-linecap="round" x1="55"   y1="27.5" x2="53.8" y2="25.2"/>
</g>

${realisticEyes(HR2, uid, false)}
${realisticNose(sk)}

<!-- ── MALE LIPS — defined, masculine (narrower: x=34–46) ── -->
<!-- Philtrum -->
<path fill="${sk.dark}" opacity="0.12"
  d="M38.5,55 Q39.5,53.5 40,53 Q40.5,53.5 41.5,55 Q40.5,55.5 40,55.5 Q39.5,55.5 38.5,55Z"/>
<path fill="${sk.lip}" opacity="0.52"
  d="M34,57 Q37,54.5 40,55.5 Q43,54.5 46,57 Q43,58.5 40,59 Q37,58.5 34,57Z"/>
<path fill="${sk.lip}" opacity="0.4"
  d="M34,57 Q36.5,61 40,62 Q43.5,61 46,57 Q44,63 40,64 Q36,63 34,57Z"/>
<path fill="none" stroke="${sk.dark}" stroke-width="1.0" stroke-linecap="round" opacity="0.36"
  d="M34.5,57.5 Q40,63.5 45.5,57.5"/>

<!-- ── 5 O'CLOCK SHADOW ── -->
<path fill="${sk.dark}" opacity="0.1"
  d="M24,52 Q27,62 40,66 Q53,62 56,52 Q52,62 40,65 Q28,62 24,52Z"/>
<path fill="${sk.dark}" opacity="0.07"
  d="M31,48 Q35,46 40,47 Q45,46 49,48 Q45,51 40,51.5 Q35,51 31,48Z"/>
<!-- Side jaw stubble dots (5 o'clock) -->
<ellipse fill="${sk.dark}" cx="24" cy="53" rx="5.5" ry="4.5" opacity="0.06"/>
<ellipse fill="${sk.dark}" cx="56" cy="53" rx="5.5" ry="4.5" opacity="0.06"/>

<!-- Right hand (signal animation) -->
${realisticHand(sk, tc, uid)}
</svg>`;
}
