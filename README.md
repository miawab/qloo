# Shirt Deal

An agent that helps a sports club's commercial team find sponsors whose customers already share the club's fanbase's taste.

Give it a club and the sponsor categories you're open to. It looks the club up in Qloo's taste graph, compares the fanbase with each candidate brand's audience, ranks the shortlist, shows where the fans are concentrated, flags brands on the rise, and writes a one-page pitch where every claim points to the Qloo result behind it.

Gambling, alcohol and interest-based lending are excluded by design.

Status: in development.

## How it uses Qloo
- `find_tags` / `describe`: resolve the club and each brand to the right Qloo entity
- `compare_audiences`: club fans vs brand fans
- `rank`: order the shortlist for the club's audience
- `where_popular`: where the fanbase is strongest, for regional deals
- `trends`: which candidate brands are rising

Qloo results describe what groups tend to like, not what any one person will do.

## License
MIT
