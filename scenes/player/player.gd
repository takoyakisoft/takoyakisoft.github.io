extends CharacterBody2D

signal leveled_up

const FRICTION = 800.0
const TOUCH_DEADZONE = 12.0
const TARGET_RADIUS = 280.0

var Bullet = preload("res://scenes/weapon/bullet.tscn")
var SwordSlash = preload("res://scenes/weapon/sword_slash.tscn")

var base_speed := 200.0
var base_speed_base := 200.0
var base_max_hp := 100.0
var max_hp := 100.0
var hp := 100.0
var max_shield := 100.0
var shield := 100.0
var shield_regen := 2.0

var xp := 0
var level := 1
var xp_to_next := 10

var relics: Dictionary = {}
var relic_timers: Dictionary = {}
var virus_stats: Dictionary = {}
var minion_stats: Dictionary = {}
var item_drop_bonus := 0.0
var tentacle_stats: Dictionary = {}

var pickup_radius := 30.0

var touch_active := false
var touch_origin := Vector2.ZERO
var touch_direction := Vector2.ZERO

var invincible_timer := 0.0
var invincible_tint_active := false
var invincible_tint := Color(1, 1, 1, 1)
var base_modulate := Color(1, 1, 1, 1)

@onready var sprite := $Sprite2D
@onready var status_label := $StatusLabel


func initialize(character_data: Dictionary) -> void:
	base_speed = character_data.get("base_speed", base_speed)
	base_speed_base = base_speed
	base_max_hp = character_data.get("base_hp", max_hp)
	max_hp = base_max_hp
	max_shield = base_max_hp
	hp = max_hp
	shield = max_shield

	relics.clear()
	relic_timers.clear()
	for relic_id in character_data.get("starting_relics", []):
		add_relic(relic_id)

	xp = 0
	level = 1
	xp_to_next = GameData.get_xp_required(level)
	update_relic_stats()


func _ready() -> void:
	add_to_group("player")
	base_modulate = sprite.modulate
	$PickupArea.add_to_group("xp_pickup")
	$PickupArea/CollisionShape2D.shape.radius = pickup_radius
	$TargetArea.monitoring = true
	$TargetArea/CollisionShape2D.shape.radius = TARGET_RADIUS


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			touch_active = true
			touch_origin = event.position
			touch_direction = Vector2.ZERO
		else:
			touch_active = false
			touch_direction = Vector2.ZERO
	elif event is InputEventScreenDrag and touch_active:
		var delta = event.position - touch_origin
		if delta.length() > TOUCH_DEADZONE:
			touch_direction = delta.normalized() * min(delta.length() / 80.0, 1.0)
		else:
			touch_direction = Vector2.ZERO


func _physics_process(delta: float) -> void:
	if invincible_timer > 0.0:
		invincible_timer = max(invincible_timer - delta, 0.0)
	update_invincible_visual()
	var direction = touch_direction
	if direction == Vector2.ZERO:
		direction = Input.get_vector("move_left", "move_right", "move_up", "move_down")

	if direction != Vector2.ZERO:
		velocity = direction * base_speed
	else:
		velocity = velocity.move_toward(Vector2.ZERO, FRICTION * delta)

	move_and_slide()

	if shield < max_shield:
		shield = min(max_shield, shield + shield_regen * delta)

	process_weapons(delta)
	queue_redraw()


func process_weapons(delta: float) -> void:
	for relic_id in relics.keys():
		var relic = GameData.RELICS.get(relic_id, {})
		var relic_type = relic.get("type")
		if relic_type != "weapon" and relic_type != "active":
			continue
		var relic_level = relics[relic_id]
		var stats = GameData.get_relic_stats(relic_id, relic_level)
		var timer = relic_timers.get(relic_id, 0.0) + delta
		if timer >= stats.get("cooldown", 1.0):
			relic_timers[relic_id] = 0.0
			if relic_id == "pistol":
				fire_pistol(stats)
			elif relic_id == "sword":
				fire_sword(stats)
			elif relic_id == "aegis":
				activate_invincibility(stats.get("invincibility_duration", 2.5))
			elif relic_id == "gravity_well":
				trigger_gravity_pulse(stats)
			elif relic_id == "berserker":
				activate_invincibility(
					stats.get("invincibility_duration", 1.4), Color(1.4, 0.4, 0.4, 1.0)
				)
				fire_berserker(stats)
			elif relic_id == "tentacle_drop":
				fire_tentacle(stats)
		else:
			relic_timers[relic_id] = timer


func fire_pistol(stats: Dictionary) -> void:
	var nearby = $TargetArea.get_overlapping_bodies()
	if nearby.is_empty():
		return
	var nearest_enemy = null
	var min_dist = INF
	for body in nearby:
		if not body.is_in_group("enemy"):
			continue
		var dist = global_position.distance_to(body.global_position)
		if dist < min_dist:
			min_dist = dist
			nearest_enemy = body
	if not nearest_enemy:
		return

	var bullets = int(stats.get("bullets", 1))
	for i in range(bullets):
		var bullet = Bullet.instantiate()
		bullet.global_position = global_position
		bullet.direction = (nearest_enemy.global_position - global_position).normalized()
		bullet.damage = stats.get("damage", 6.0)
		bullet.crit_chance = stats.get("crit", 0.05)
		if not virus_stats.is_empty():
			bullet.virus_stats = virus_stats
		get_parent().add_child(bullet)


func fire_sword(stats: Dictionary) -> void:
	var slash = SwordSlash.instantiate()
	slash.global_position = global_position
	slash.damage = stats.get("damage", 10.0)
	slash.duration = stats.get("duration", 0.2)
	slash.crit_chance = stats.get("crit", 0.05)
	if not virus_stats.is_empty():
		slash.virus_stats = virus_stats
	var collision_shape: CollisionShape2D = slash.get_node("CollisionShape2D")
	if collision_shape:
		var desired_radius = stats.get("radius", 70.0)
		var circle_shape := CircleShape2D.new()
		circle_shape.radius = desired_radius
		collision_shape.shape = circle_shape
	get_parent().add_child(slash)


func fire_berserker(stats: Dictionary) -> void:
	var slam = SwordSlash.instantiate()
	slam.global_position = global_position
	slam.damage = stats.get("damage", 16.0)
	slam.duration = stats.get("duration", 0.2)
	slam.crit_chance = stats.get("crit", 0.05)
	if not virus_stats.is_empty():
		slam.virus_stats = virus_stats
	var collision_shape: CollisionShape2D = slam.get_node("CollisionShape2D")
	if collision_shape:
		var desired_radius = stats.get("radius", 75.0)
		var circle_shape := CircleShape2D.new()
		circle_shape.radius = desired_radius
		collision_shape.shape = circle_shape
	get_parent().add_child(slam)


func fire_tentacle(stats: Dictionary) -> void:
	var pulse = SwordSlash.instantiate()
	pulse.global_position = global_position
	pulse.damage = stats.get("damage", 7.0)
	pulse.duration = stats.get("duration", 0.2)
	pulse.crit_chance = stats.get("crit", 0.0)
	pulse.stun_duration = stats.get("tentacle_stun", 0.8)
	pulse.tentacle_mark_duration = stats.get("tentacle_mark_duration", 3.0)
	pulse.tint_color = Color(0.6, 1.2, 0.7, 1.0)
	pulse.tentacle_visual = true
	var collision_shape: CollisionShape2D = pulse.get_node("CollisionShape2D")
	if collision_shape:
		var desired_radius = stats.get("radius", 95.0)
		var circle_shape := CircleShape2D.new()
		circle_shape.radius = desired_radius
		collision_shape.shape = circle_shape
	get_parent().add_child(pulse)


func trigger_gravity_pulse(stats: Dictionary) -> void:
	var radius = stats.get("gravity_radius", 200.0)
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if not is_instance_valid(enemy):
			continue
		var to_player = global_position - enemy.global_position
		var dist = to_player.length()
		if dist <= 0.0 or dist > radius:
			continue
		if enemy.has_method("apply_orbit"):
			enemy.apply_orbit(self, stats)
		elif enemy.has_method("apply_external_velocity"):
			var pull = to_player.normalized() * 300.0
			enemy.apply_external_velocity(pull)


func add_relic(relic_id: String) -> void:
	if relics.has(relic_id):
		var new_level = min(relics[relic_id] + 1, GameData.MAX_RELIC_LEVEL)
		relics[relic_id] = new_level
	else:
		if not can_add_relic(relic_id):
			return
		relics[relic_id] = 1
		relic_timers[relic_id] = 0.0
	update_relic_stats()


func update_relic_stats() -> void:
	pickup_radius = 30.0
	base_speed = base_speed_base
	shield_regen = 2.0
	virus_stats = {}
	minion_stats = {}
	item_drop_bonus = 0.0
	tentacle_stats = {}
	var bonus_hp = 0.0
	for relic_id in relics.keys():
		var relic_level = relics[relic_id]
		var stats = GameData.get_relic_stats(relic_id, relic_level)
		if stats.has("pickup_bonus"):
			pickup_radius += 30.0 * stats["pickup_bonus"]
		if stats.has("move_speed_bonus"):
			base_speed += stats["move_speed_bonus"]
		if stats.has("max_hp_bonus"):
			bonus_hp += stats["max_hp_bonus"]
		if stats.has("shield_regen"):
			shield_regen += stats["shield_regen"]
		if stats.has("virus_chance"):
			virus_stats = stats.duplicate(true)
		if stats.has("minion_chance"):
			minion_stats = stats.duplicate(true)
		if stats.has("item_drop_bonus"):
			item_drop_bonus += stats["item_drop_bonus"]
		if stats.has("tentacle_drop_bonus"):
			tentacle_stats = stats.duplicate(true)
	max_hp = base_max_hp + bonus_hp
	max_shield = max_hp
	hp = min(hp, max_hp)
	shield = min(shield, max_shield)
	$PickupArea/CollisionShape2D.shape.radius = pickup_radius


func can_add_relic(relic_id: String) -> bool:
	var category = get_relic_category(relic_id)
	var current = count_relics_by_category(category)
	var cap = GameData.MAX_STAT_RELICS if category == "stat" else GameData.MAX_ATTACK_RELICS
	return current < cap


func get_relic_category(relic_id: String) -> String:
	var relic = GameData.RELICS.get(relic_id, {})
	return relic.get("category", "stat")


func count_relics_by_category(category: String) -> int:
	var count = 0
	for relic_id in relics.keys():
		if get_relic_category(relic_id) == category:
			count += 1
	return count


func apply_damage(amount: float) -> void:
	if invincible_timer > 0.0:
		return
	var remaining = amount
	if shield > 0:
		var absorbed = min(shield, remaining)
		shield -= absorbed
		remaining -= absorbed
	if remaining > 0:
		hp -= remaining
	var gameplay = get_tree().get_first_node_in_group("gameplay")
	if gameplay:
		gameplay.spawn_damage_number(global_position + Vector2(0, -30), amount, true)
	if hp <= 0:
		game_over()


func gain_xp(amount: int) -> void:
	xp += amount
	while xp >= xp_to_next:
		xp -= xp_to_next
		level += 1
		xp_to_next = GameData.get_xp_required(level)
		emit_signal("leveled_up")


func heal_full() -> void:
	hp = max_hp
	shield = max_shield


func activate_invincibility(duration: float, tint: Color = Color(1, 1, 1, 1)) -> void:
	invincible_timer = max(invincible_timer, duration)
	if tint != Color(1, 1, 1, 1):
		invincible_tint_active = true
		invincible_tint = tint


func update_invincible_visual() -> void:
	if not is_instance_valid(sprite):
		return
	if invincible_timer > 0.0 and invincible_tint_active:
		sprite.modulate = invincible_tint
	elif invincible_timer <= 0.0:
		invincible_tint_active = false
		sprite.modulate = base_modulate
	update_status_label()


func update_status_label() -> void:
	if not is_instance_valid(status_label):
		return
	if invincible_timer > 0.0:
		status_label.text = "無敵"
		status_label.modulate = Color(1.0, 0.4, 0.4, 1.0)
		status_label.visible = true
	else:
		status_label.visible = false


func game_over() -> void:
	var gameplay = get_tree().get_first_node_in_group("gameplay")
	if gameplay:
		gameplay.on_player_defeated()


func _draw() -> void:
	var bar_width = 60.0
	var bar_height = 6.0
	var offset = Vector2(-bar_width / 2.0, -60.0)
	var hp_ratio = 0.0 if max_hp <= 0 else hp / max_hp
	var shield_ratio = 0.0 if max_shield <= 0 else shield / max_shield
	var bg_rect = Rect2(offset, Vector2(bar_width, bar_height * 2 + 3))
	draw_rect(bg_rect, Color(0, 0, 0, 0.4))
	draw_rect(Rect2(offset, Vector2(bar_width * shield_ratio, bar_height)), Color("4ad9ff"))
	draw_rect(
		Rect2(offset + Vector2(0, bar_height + 3), Vector2(bar_width * hp_ratio, bar_height)),
		Color("ff5a5a")
	)
