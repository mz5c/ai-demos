import random
import pygame
from typing import List, Optional, Tuple

from config import *


class Tank:
    def __init__(self, x: float, y: float, size: int, color: tuple,
                 speed: int, hp: int, bullet_speed: int, shoot_cooldown: int,
                 is_player: bool):
        self.x = x
        self.y = y
        self.size = size
        self.color = color
        self.speed = speed
        self.hp = hp
        self.max_hp = hp
        self.bullet_speed = bullet_speed
        self.shoot_cooldown_max = shoot_cooldown
        self.is_player = is_player
        self.direction = 0  # 0:up, 1:right, 2:down, 3:left
        self.rect = pygame.Rect(int(x), int(y), size, size)
        self.alive = True
        self.shoot_timer = 0
        self.ai_timer = random.randint(30, 90)

    def draw(self, screen: pygame.Surface) -> None:
        if not self.alive:
            return
        # Body
        pygame.draw.rect(screen, self.color, self.rect)
        # Barrel
        cx = self.x + self.size // 2
        cy = self.y + self.size // 2
        length = self.size // 2
        width = self.size // 6
        ex, ey = cx, cy
        if self.direction == 0:
            ey -= length
        elif self.direction == 1:
            ex += length
        elif self.direction == 2:
            ey += length
        elif self.direction == 3:
            ex -= length
        pygame.draw.line(screen, GRAY, (cx, cy), (ex, ey), width)
        # HP bar for player
        if self.is_player and self.hp < self.max_hp:
            bar_width = self.size
            bar_height = 4
            hp_ratio = self.hp / self.max_hp
            pygame.draw.rect(screen, RED, (self.x, self.y - 8, bar_width, bar_height))
            pygame.draw.rect(screen, GREEN, (self.x, self.y - 8, bar_width * hp_ratio, bar_height))

    def move(self, dx: float, dy: float, obstacles: List[pygame.Rect]) -> None:
        self.x += dx
        self.y += dy
        self.x = max(0, min(self.x, SCREEN_WIDTH - self.size))
        self.y = max(0, min(self.y, SCREEN_HEIGHT - self.size))
        self.rect.topleft = (int(self.x), int(self.y))
        # Check collision and revert
        for obs in obstacles:
            if self.rect.colliderect(obs):
                self.x = max(0, min(self.x - dx, SCREEN_WIDTH - self.size))
                self.y = max(0, min(self.y - dy, SCREEN_HEIGHT - self.size))
                self.rect.topleft = (int(self.x), int(self.y))
                break

    def shoot(self) -> Optional["Bullet"]:
        if self.shoot_timer > 0:
            return None
        self.shoot_timer = self.shoot_cooldown_max
        cx = self.x + self.size // 2 - BULLET_SIZE // 2
        cy = self.y + self.size // 2 - BULLET_SIZE // 2
        if self.direction == 0:
            cy -= self.size // 2
        elif self.direction == 1:
            cx += self.size // 2
        elif self.direction == 2:
            cy += self.size // 2
        elif self.direction == 3:
            cx -= self.size // 2
        return Bullet(cx, cy, self.direction, self.bullet_speed, self)

    def take_damage(self) -> None:
        self.hp -= 1
        if self.hp <= 0:
            self.alive = False

    def update_cooldown(self) -> None:
        if self.shoot_timer > 0:
            self.shoot_timer -= 1

    def update_ai(self, player_pos: Tuple[float, float], obstacles: List[pygame.Rect]) -> Optional["Bullet"]:
        if self.is_player or not self.alive:
            return None
        self.ai_timer -= 1
        bullet = None
        if self.ai_timer <= 0:
            self.ai_timer = random.randint(30, 90)
            # 40% chance to track player
            if random.random() < 0.4:
                px, py = player_pos
                cx = self.x + self.size // 2
                cy = self.y + self.size // 2
                dx = px - cx
                dy = py - cy
                if abs(dx) > abs(dy):
                    self.direction = 1 if dx > 0 else 3
                else:
                    self.direction = 0 if dy < 0 else 2
            else:
                self.direction = random.randint(0, 3)
            # Shoot (independent of movement)
            if random.random() < 0.5:
                bullet = self.shoot()
        # Move in current direction
        dx, dy = 0, 0
        if self.direction == 0:
            dy = -self.speed
        elif self.direction == 1:
            dx = self.speed
        elif self.direction == 2:
            dy = self.speed
        elif self.direction == 3:
            dx = -self.speed
        self.move(dx, dy, obstacles)
        return bullet


class Bullet:
    def __init__(self, x: float, y: float, direction: int, speed: int, owner: Tank):
        self.x = x
        self.y = y
        self.direction = direction
        self.speed = speed
        self.owner = owner
        self.size = BULLET_SIZE
        self.rect = pygame.Rect(int(x), int(y), BULLET_SIZE, BULLET_SIZE)
        self.active = True

    def update(self) -> None:
        if not self.active:
            return
        if self.direction == 0:
            self.y -= self.speed
        elif self.direction == 1:
            self.x += self.speed
        elif self.direction == 2:
            self.y += self.speed
        elif self.direction == 3:
            self.x -= self.speed
        self.rect.topleft = (int(self.x), int(self.y))
        # Out of bounds
        if (self.x < -self.size or self.x > SCREEN_WIDTH or
                self.y < -self.size or self.y > SCREEN_HEIGHT):
            self.active = False

    def draw(self, screen: pygame.Surface) -> None:
        if self.active:
            pygame.draw.rect(screen, YELLOW, self.rect)


class BrickWall:
    def __init__(self, x: float, y: float, width: int, height: int):
        self.rect = pygame.Rect(int(x), int(y), width, height)
        self.color = BRICK_COLOR
        self.active = True

    def draw(self, screen: pygame.Surface) -> None:
        if self.active:
            pygame.draw.rect(screen, self.color, self.rect)


class Base:
    def __init__(self, x: float, y: float):
        self.rect = pygame.Rect(int(x), int(y), BASE_SIZE, BASE_SIZE)
        self.color = BASE_COLOR
        self.active = True

    def draw(self, screen: pygame.Surface) -> None:
        if self.active:
            pygame.draw.rect(screen, self.color, self.rect)
            # Draw a simple "eagle" pattern
            mid = self.rect.centerx
            pygame.draw.polygon(screen, BLACK, [
                (mid, self.rect.y + 5),
                (self.rect.x + 5, self.rect.y + self.rect.height - 5),
                (self.rect.right - 5, self.rect.y + self.rect.height - 5),
            ])
