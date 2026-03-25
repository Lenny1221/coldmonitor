# LilyGO T-SIM7670G S3 (OPI flash): stub-based verify faalt vaak op USB-CDC.
# Voeg --no-stub toe vóór het write_flash subcommando.
Import("env")


def _inject_no_stub(source, target, env):
    flags = env.get("UPLOADERFLAGS")
    if not flags or "--no-stub" in flags:
        return
    try:
        i = list(flags).index("write_flash")
    except ValueError:
        return
    new_flags = list(flags[:i]) + ["--no-stub"] + list(flags[i:])
    env.Replace(UPLOADERFLAGS=new_flags)


env.AddPreAction("upload", _inject_no_stub)
