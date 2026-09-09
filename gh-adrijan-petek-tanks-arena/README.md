# Tanks Arena

A fast-paced, multiplayer HTML5 tank battle game with up to 30 players. Drive, shoot, and survive in this top-down arena shooter featuring realistic car-like controls, power-ups, obstacles, and explosive combat.

![Tanks Arena](https://img.shields.io/badge/HTML5-Game-orange) ![Players](https://img.shields.io/badge/Players-1--30-blue) ![Canvas](https://img.shields.io/badge/Rendering-Canvas2D-green)

## 🎮 Features

- **30-Player Support**: Local demo with bots filling empty slots
- **Realistic Controls**: Car-like driving with momentum and friction
- **Power-ups**: Speed boost, rapid fire, damage upgrades, shields, and more
- **Obstacles**: City-like environment with destructible buildings
- **Explosive Combat**: Tanks explode dramatically when destroyed
- **Mobile Support**: Touch controls for mobile devices
- **SDK Ready**: Hooks for Remix/Farcade/MiniApp integration
- **Audio System**: Background music and sound effects
- **Visual Effects**: Shadows, glows, gradients, and particle effects

## 🚀 Quick Start

### Option 1: Play Online
Visit the [GitHub Pages deployment](https://yourusername.github.io/tanks-arena) to play directly in your browser.

### Option 2: Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/tanks-arena.git
   cd tanks-arena
   ```

2. Open `tanks-arena.html` in your web browser

3. Click "Join Arena" to start playing!

## 🎯 How to Play

### Objective
- Drive around the arena
- Shoot other tanks to earn kills
- Avoid getting hit and destroyed
- Collect power-ups to gain advantages
- Use obstacles for cover and tactical positioning

### Controls

#### Keyboard (Desktop)
- **WASD** or **Arrow Keys**: Drive and turn (car-like controls)
- **Left Click** or **Mouse**: Aim and fire
- **Mouse Movement**: Aim turret independently

#### Touch (Mobile)
- **Virtual Joystick**: Drive and turn
- **Fire Button**: Shoot
- **Tap to Aim**: Touch anywhere to aim and fire

### Power-ups
- ⚡ **Speed Boost**: Increased movement speed
- 🔫 **Rapid Fire**: Faster shooting
- 💥 **Damage Up**: More powerful bullets
- 🛡️ **Shield**: Damage resistance
- ❤️ **Regeneration**: Auto-heal over time
- 📏 **Big Bullets**: Larger projectiles
- 🎯 **Multi Shot**: Fire multiple bullets
- 🏹 **Homing Bullets**: Bullets track targets
- ❄️ **Freeze**: Slow down enemies
- 👻 **Invisibility**: Become temporarily invisible

## 🏗️ Technical Details

### Architecture
- **Pure HTML5**: No external dependencies
- **Canvas 2D**: Hardware-accelerated rendering
- **Real-time Physics**: Custom collision detection and movement
- **Procedural Generation**: Random obstacle and power-up placement
- **Modular Code**: Clean separation of game logic, rendering, and UI

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers with touch support

### Performance
- Optimized for 60 FPS gameplay
- Efficient rendering with camera culling
- Low memory footprint
- Scales from small arenas (3x screen) to massive (6x screen)

## 🔧 Customization

### Adding New Power-ups
Edit the `POWERUP_TYPES` array and corresponding logic in `updateLocalPlayer()`.

### Changing Arena Size
Modify the `arenaSizeSelect` options and scaling factors in `applyArenaSize()`.

### Adding Sounds
Replace the placeholder URLs in the sound constants with your audio files.

### SDK Integration
Implement the `notify*` functions to connect with your backend platform.

## 📁 Project Structure

```
tanks-arena/
├── tanks-arena.html    # Main game file (HTML + CSS + JS)
├── README.md          # This file
└── .github/
    └── workflows/     # GitHub Actions
```

## 🚀 Deployment

### GitHub Pages
This project is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions will automatically deploy to `gh-pages` branch
3. Access at `https://yourusername.github.io/tanks-arena`

### Manual Deployment
Host the `tanks-arena.html` file on any web server. No build process required!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Maintain the single-file architecture
- Test on multiple browsers and devices
- Keep performance optimized
- Add comments for complex logic
- Follow existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with vanilla HTML5 technologies
- Inspired by classic tank battle games
- Special thanks to the open-source community

## 🐛 Issues & Support

- **Bug Reports**: [Open an issue](https://github.com/yourusername/tanks-arena/issues)
- **Feature Requests**: [Start a discussion](https://github.com/yourusername/tanks-arena/discussions)
- **Questions**: Check the [Wiki](https://github.com/yourusername/tanks-arena/wiki) first

---

**Ready to battle?** Join the arena and prove your tank driving skills! 🛡️⚡</content>
<parameter name="filePath">c:\Users\Hp\Downloads\game\README.md