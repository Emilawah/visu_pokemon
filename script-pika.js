// Animation du Pikachu et du fond au défilement
document.addEventListener('DOMContentLoaded', () => {
    const pikachu = document.getElementById('moving-pikachu');
    const animationSection = document.getElementById('pikachu-animation-section');

    if (!pikachu || !animationSection) return;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        const startPoint = animationSection.offsetTop - window.innerHeight + 100;
        const endPoint = animationSection.offsetTop + animationSection.offsetHeight;

        if (currentScrollY > startPoint && currentScrollY < endPoint) {
            const totalRange = endPoint - startPoint;
            const progress = Math.max(0, Math.min(1, (currentScrollY - startPoint) / totalRange));

            const translateX = progress * 85;

            pikachu.style.opacity = progress > 0.05 && progress < 0.95 ? 1 : 0;
            pikachu.style.transform = `translateX(${translateX}vw)`;

            // NOUVEAU : Déplacer le fond en fonction du scroll
            // Tu peux ajuster le multiplicateur (ici 500) pour changer la vitesse de défilement du fond
            const backgroundOffset = progress * -500;
            animationSection.style.backgroundPosition = `${backgroundOffset}px 0`;

        } else {
            pikachu.style.opacity = 0;
        }
    });
});