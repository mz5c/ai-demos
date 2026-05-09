import random
from typing import List

import pygame

from config import *
from entities import Base, BrickWall, Bullet, Tank
from managers import CollisionManager, WaveManager


class GameState:
    def handle_event(self, event: pygame.event.Event) -> "GameState":
        return self

    def update(self) -> "GameState":
        return self

    def draw(self, screen: pygame.Surface) -> None:
        pass


class MenuState(GameState):
    def __init__(self):
        self.title_text = FONT_TITLE.render("TANK BATTLE", True, WHITE)
        self.hint_text = FONT_SMALL.render("Press SPACE to Start", True, WHITE)

    def handle_event(self, event: pygame.event.Event) -> GameState:
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            return PlayingState()
        return self

    def draw(self, screen: pygame.Surface) -> None:
        screen.fill(BLACK)
        tx = (SCREEN_WIDTH - self.title_text.get_width()) // 2
        ty = SCREEN_HEIGHT // 3
        screen.blit(self.title_text, (tx, ty))
        hx = (SCREEN_WIDTH - self.hint_text.get_width()) // 2
        hy = SCREEN_HEIGHT // 2 + 20
        screen.blit(self.hint_text, (hx, hy))


class PlayingState(GameState):
    def __init__(self):
        # Player
        player_x = (SCREEN_WIDTH - TANK_SIZE) // 2
        player_y = SCREEN_HEIGHT - TANK_SIZE - 30
        self.player = Tank(
            player_x, player_y, TANK_SIZE, PLAYER_COLOR,
            PLAYER_SPEED, PLAYER_HP, PLAYER_BULLET_SPEED,
            PLAYER_SHOOT_COOLDOWN, is_player=True,
        )
        # Bullets
        self.enemy_bullets: List[Bullet] = []
        self.player_bullets: List[Bullet] = []

        # Walls - build map
        self.walls: List[BrickWall] = []
        self._build_map()

        # Base
        self.base = Base(BASE_X, BASE_Y)

        # Managers
        self.wave_manager = WaveManager()
        self.collision_manager = CollisionManager()

        # Stats
        self.score = 0
        self.game_over = False

        # State for level transition
        self.level_complete = False
        self.level_complete_timer = 0

    def _build_map(self) -> None:
        """Build the map with boundary walls and obstacles."""
        random.seed(42)  # Fixed seed for consistent layout

        # Boundary walls (top, left, right) — NOT bottom, player needs to enter
        for x in range(0, SCREEN_WIDTH, WALL_SIZE):
            self.walls.append(BrickWall(x, 0, WALL_SIZE, WALL_SIZE))
        for y in range(WALL_SIZE, SCREEN_HEIGHT, WALL_SIZE):
            self.walls.append(BrickWall(0, y, WALL_SIZE, WALL_SIZE))
            self.walls.append(BrickWall(SCREEN_WIDTH - WALL_SIZE, y, WALL_SIZE, WALL_SIZE))

        # Base protection walls (U-shape above base)
        bx, by = BASE_X, BASE_Y
        # Left pillar
        self.walls.append(BrickWall(bx - 30, by - 20, 20, 20))
        # Right pillar
        self.walls.append(BrickWall(bx + BASE_SIZE + 10, by - 20, 20, 20))
        # Top bar
        self.walls.append(BrickWall(bx - 10, by - 40, BASE_SIZE + 20, 20))

        # Random obstacles in the middle area (2x2 block clusters)
        for _ in range(8):
            placed = False
            attempts = 0
            while not placed and attempts < 20:
                wx = random.randint(WALL_SIZE, SCREEN_WIDTH - 2 * WALL_SIZE - WALL_SIZE)
                wy = random.randint(100, SCREEN_HEIGHT - 150)
                wr = pygame.Rect(wx, wy, WALL_SIZE, WALL_SIZE)
                # Don't place on spawn points
                overlap_spawn = any(
                    pygame.Rect(sx, sy, TANK_SIZE, TANK_SIZE).colliderect(wr)
                    for sx, sy in SPAWN_POINTS
                )
                # Don't place on base area
                base_area = pygame.Rect(BASE_X - 40, BASE_Y - 40, BASE_SIZE + 80, BASE_SIZE + 40)
                if not overlap_spawn and not base_area.colliderect(wr):
                    # Group walls into 2x2 blocks (40x40)
                    self.walls.append(BrickWall(wx, wy, WALL_SIZE, WALL_SIZE))
                    self.walls.append(BrickWall(wx + WALL_SIZE, wy, WALL_SIZE, WALL_SIZE))
                    self.walls.append(BrickWall(wx, wy + WALL_SIZE, WALL_SIZE, WALL_SIZE))
                    self.walls.append(BrickWall(wx + WALL_SIZE, wy + WALL_SIZE, WALL_SIZE, WALL_SIZE))
                    placed = True
                attempts += 1

    def get_obstacles(self) -> List[pygame.Rect]:
        """Get all obstacle rects for tank collision."""
        rects = [w.rect for w in self.walls if w.active]
        rects.append(self.base.rect)
        for enemy in self.wave_manager.active_enemies:
            if enemy.alive:
                rects.append(enemy.rect)
        return rects

    def handle_event(self, event: pygame.event.Event) -> GameState:
        if self.level_complete or self.game_over:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                if self.level_complete:
                    return self._next_level()
                return MenuState()
            return self
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            bullet = self.player.shoot()
            if bullet:
                self.player_bullets.append(bullet)
        return self

    def _next_level(self) -> "PlayingState":
        new_state = PlayingState()
        new_state.score = self.score
        new_state.wave_manager.level = self.wave_manager.level + 1
        new_state.wave_manager.reset_for_level()
        return new_state

    def update(self) -> GameState:
        if self.game_over or self.level_complete:
            return self

        if not self.player.alive:
            self.game_over = True
            return self

        # Player movement
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            dx -= self.player.speed
            self.player.direction = 3
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            dx += self.player.speed
            self.player.direction = 1
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            dy -= self.player.speed
            self.player.direction = 0
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            dy += self.player.speed
            self.player.direction = 2

        obstacles = self.get_obstacles()
        self.player.move(dx, dy, obstacles)

        # Player shoot cooldown
        self.player.update_cooldown()

        # Enemy AI and spawning
        player_pos = (self.player.x, self.player.y)
        new_enemy_bullets = self.wave_manager.update(obstacles, player_pos)
        self.enemy_bullets.extend(new_enemy_bullets)

        # Process player bullets
        for bullet in self.player_bullets:
            bullet.update()
        self.player_bullets = [b for b in self.player_bullets if b.active]

        # Process enemy bullets
        for bullet in self.enemy_bullets:
            bullet.update()
        self.enemy_bullets = [b for b in self.enemy_bullets if b.active]

        # Collision detection
        all_bullets = self.player_bullets + self.enemy_bullets
        result = self.collision_manager.check_bullets(
            all_bullets, self.walls, self.base, self.player,
            self.wave_manager.active_enemies,
        )

        # Handle results
        for enemy in result['enemies_killed']:
            self.score += 100
            self.wave_manager.on_enemy_killed()

        if result['base_destroyed']:
            self.game_over = True

        if not self.player.alive:
            self.game_over = True

        # Remove inactive bullets
        self.player_bullets = [b for b in self.player_bullets if b.active]
        self.enemy_bullets = [b for b in self.enemy_bullets if b.active]

        # Check wave complete
        if self.wave_manager.is_wave_complete():
            self.level_complete = True

        return self

    def draw(self, screen: pygame.Surface) -> None:
        screen.fill(BLACK)

        # Draw walls
        for wall in self.walls:
            wall.draw(screen)

        # Draw base
        self.base.draw(screen)

        # Draw player
        self.player.draw(screen)

        # Draw enemies
        for enemy in self.wave_manager.active_enemies:
            enemy.draw(screen)

        # Draw bullets
        for bullet in self.player_bullets + self.enemy_bullets:
            bullet.draw(screen)

        # Draw HUD
        score_text = FONT_SMALL.render(f"Score: {self.score}", True, WHITE)
        screen.blit(score_text, (10, SCREEN_HEIGHT - 30))

        lives_text = FONT_SMALL.render(f"HP: {self.player.hp}", True, WHITE)
        screen.blit(lives_text, (SCREEN_WIDTH - 120, SCREEN_HEIGHT - 30))

        level_text = FONT_SMALL.render(f"Level {self.wave_manager.level}", True, WHITE)
        screen.blit(level_text, ((SCREEN_WIDTH - level_text.get_width()) // 2, SCREEN_HEIGHT - 30))

        # Enemy count
        remaining = self.wave_manager.enemies_total - self.wave_manager.enemies_killed
        enemy_text = FONT_SMALL.render(f"Enemies: {remaining}", True, WHITE)
        screen.blit(enemy_text, (SCREEN_WIDTH - 140, SCREEN_HEIGHT - 55))

        # Level complete overlay
        if self.level_complete:
            overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 128))
            screen.blit(overlay, (0, 0))
            win_text = FONT_LARGE.render("LEVEL CLEAR!", True, YELLOW)
            wx = (SCREEN_WIDTH - win_text.get_width()) // 2
            wy = SCREEN_HEIGHT // 2 - 30
            screen.blit(win_text, (wx, wy))
            hint = FONT_SMALL.render("Press SPACE for Next Level", True, WHITE)
            hx = (SCREEN_WIDTH - hint.get_width()) // 2
            hy = SCREEN_HEIGHT // 2 + 20
            screen.blit(hint, (hx, hy))

        # Game over overlay
        if self.game_over:
            overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            screen.blit(overlay, (0, 0))
            go_text = FONT_LARGE.render("GAME OVER", True, RED)
            gx = (SCREEN_WIDTH - go_text.get_width()) // 2
            gy = SCREEN_HEIGHT // 2 - 40
            screen.blit(go_text, (gx, gy))
            score_text = FONT_SMALL.render(f"Final Score: {self.score}", True, WHITE)
            sx = (SCREEN_WIDTH - score_text.get_width()) // 2
            sy = SCREEN_HEIGHT // 2 + 10
            screen.blit(score_text, (sx, sy))
            hint = FONT_SMALL.render("Press SPACE to Return", True, WHITE)
            hx = (SCREEN_WIDTH - hint.get_width()) // 2
            hy = SCREEN_HEIGHT // 2 + 50
            screen.blit(hint, (hx, hy))
