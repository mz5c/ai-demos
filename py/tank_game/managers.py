import random
from typing import Dict, List

import pygame

from config import *
from entities import Base, BrickWall, Bullet, Tank


class WaveManager:
    def __init__(self):
        self.level = 1
        self.enemies_total = self._calc_enemy_count()
        self.enemies_spawned = 0
        self.enemies_killed = 0
        self.max_active = MAX_ACTIVE_ENEMIES
        self.spawn_timer = 0
        self.spawn_interval = SPAWN_INTERVAL
        self.spawn_points = SPAWN_POINTS
        self.spawn_index = 0
        self.active_enemies: List[Tank] = []

    def _calc_enemy_count(self) -> int:
        return BASE_ENEMY_COUNT + (self.level - 1) * 2

    def reset_for_level(self) -> None:
        self.enemies_total = self._calc_enemy_count()
        self.enemies_spawned = 0
        self.enemies_killed = 0
        self.spawn_timer = 0
        self.spawn_index = 0
        self.active_enemies.clear()

    def update(self, obstacles: List[pygame.Rect], player_pos: tuple) -> List[Bullet]:
        """Returns list of newly created enemy bullets."""
        new_bullets: List[Bullet] = []

        # Remove dead enemies
        self.active_enemies = [e for e in self.active_enemies if e.alive]

        # Spawn logic
        if (self.enemies_spawned < self.enemies_total
                and len(self.active_enemies) < self.max_active):
            self.spawn_timer -= 1
            if self.spawn_timer <= 0:
                sp = self.spawn_points[self.spawn_index % len(self.spawn_points)]
                self.spawn_index += 1

                # Check spawn point not blocked
                spawn_rect = pygame.Rect(int(sp[0]), int(sp[1]), TANK_SIZE, TANK_SIZE)
                blocked = any(spawn_rect.colliderect(e.rect) for e in self.active_enemies)

                if not blocked:
                    enemy = Tank(
                        sp[0], sp[1], TANK_SIZE, ENEMY_COLOR,
                        ENEMY_SPEED, ENEMY_HP, ENEMY_BULLET_SPEED,
                        ENEMY_SHOOT_COOLDOWN, is_player=False,
                    )
                    self.active_enemies.append(enemy)
                    self.enemies_spawned += 1

                self.spawn_timer = self.spawn_interval

        # Update AI for all active enemies
        for enemy in self.active_enemies:
            enemy.update_cooldown()
            bullet = enemy.update_ai(player_pos, obstacles)
            if bullet:
                new_bullets.append(bullet)

        return new_bullets

    def is_wave_complete(self) -> bool:
        return (self.enemies_killed >= self.enemies_total
                and all(not e.alive for e in self.active_enemies))

    def on_enemy_killed(self) -> None:
        self.enemies_killed += 1


class CollisionManager:
    @staticmethod
    def check_bullets(
        bullets: List[Bullet],
        walls: List[BrickWall],
        base: Base,
        player: Tank,
        enemies: List[Tank],
    ) -> Dict[str, object]:
        """
        Returns dict with keys:
          'player_hit' (bool),
          'base_destroyed' (bool),
          'enemies_killed' (List[Tank])
        """
        result: Dict[str, object] = {
            'player_hit': False,
            'base_destroyed': False,
            'enemies_killed': [],
        }

        killed_list: List[Tank] = []

        for bullet in bullets:
            if not bullet.active:
                continue

            hit = False

            # Check walls
            for wall in walls:
                if wall.active and bullet.rect.colliderect(wall.rect):
                    wall.active = False
                    bullet.active = False
                    hit = True
                    break

            if hit:
                continue

            # Check base
            if base.active and bullet.rect.colliderect(base.rect):
                base.active = False
                bullet.active = False
                result['base_destroyed'] = True
                continue

            # Check enemy tanks (player bullets only)
            if bullet.owner == player:
                for enemy in enemies:
                    if enemy.alive and bullet.rect.colliderect(enemy.rect):
                        enemy.take_damage()
                        bullet.active = False
                        if not enemy.alive:
                            killed_list.append(enemy)
                        hit = True
                        break

            if hit:
                continue

            # Check player tank (enemy bullets only)
            if bullet.owner != player and player.alive and bullet.rect.colliderect(player.rect):
                player.take_damage()
                bullet.active = False
                result['player_hit'] = True

        result['enemies_killed'] = killed_list
        return result
