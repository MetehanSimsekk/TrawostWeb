import trawostIcon from '../assets/logo/trawostIconHD.png';

const ThanksPage = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#E50914] text-center px-4">
      <img src={trawostIcon} alt="Trawost Logo" className="w-64 h-64 mb-4" />

      <h1 className="text-5xl font-qanelas text-white">Trawost</h1>

      <p className="text-white text-2xl mt-3 font-qanelas font-semibold">
  Başvurunuz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.
</p>
    </div>
  );
};

export default ThanksPage;