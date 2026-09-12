<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Software: Operating Systems, Programming Languages & the Abstraction Stack
description: How the software that makes AI possible was actually built — the operating systems, the languages, the tools, and the minds behind them.
icon: &#128190;
part: 6
order: 10
color: text-secondary
topics: history, programming, society
-->

<div class="md">
## Software: The Layer That Made Everything Else Possible

Every large language model runs on a stack of software that is, strictly speaking, older than the idea of an LLM by several decades. The GPU does the matrix math; but *something* has to decide which GPU runs which layer, when to move data between memory and disk, how a process that has run for a week keeps from corrupting its neighbor, and how a line of Python becomes a billion instructions on a specific chip. That something is not a single invention. It is a **ladder of abstractions** — an operating system, a compiler, a library, a runtime, a framework — each rung hiding the messy reality of the rung below and exposing a small, clean interface to the rung above.

This is the same idea that runs through the whole of this course, the “extra level of indirection” that David Wheeler named and that the wheel itself prefigured. Hardware gives you *transistors*. The **operating system** gives you *files, processes and memory*. A **programming language** and its **compiler** give you *expressions and functions*. A **library** gives you *data structures*. A **framework** gives you *neural layers*. And a **model** gives you *text*. Remove any single rung and the ones above it fall; add a rung and the ones above it become possible.

This page is a deep dive into that ladder. It is deliberately broader than a “history of Unix” or a “top ten programming languages.” It covers the operating systems you will never hear named (GM-NAA I/O, Multics, VMS, Plan 9, the Hurd, BeOS), the languages that shaped how we *think* about computation (Lisp, ALGOL, Smalltalk, Prolog, APL), the tools that made it possible to *maintain* software complex enough to be useful (compilers, `make`, version control), and the people and ideas — their rivalries, their ideologies, their stubbornness — that decided which abstractions survived. Because the single most important fact about software is not technical: it is that software was built by **rival minds competing over the shape of thought itself**, and without that competition there is no stack, and no AI on top of it.

The framing borrowed from the [Untold History](untold_history) chapter applies directly here: the operating system, the compiler and the version-control system are all **displaced prerequisites**. They were invented to solve problems that had nothing to do with intelligence — scheduling batch jobs at a car factory, translating one notation into another, keeping a team's code from colliding — and yet every one of them is a load-bearing fact of modern machine learning.
</div>

<div class="md">
## The Abstraction Ladder, Stacked

To keep the thread visible while we climb, here is the whole stack from silicon to sentence, with the historical moment each rung was nailed down:

* **Silicon / the transistor** (1947) — the physical switch.
* **The stored program** (1948) — the idea that the *instructions* live in the same memory as the *data* (\citeauthor{vonneumann}'s \citeyear{vonneumann} report is the canonical statement of this).
* **The assembler** (1952) — the first *translator* that maps a human-readable mnemonic to machine code.
* **The compiler** (1952; see Grace Hopper below) — the first *translator* from a whole language.
* **The operating system** (1956) — the first program that *manages the machine for you*.
* **The high-level language** (FORTRAN 1957, Lisp 1958) — the first languages that let you speak about *mathematics* and *symbols*, not about *wires*.
* **The portable systems language** (C, 1972) — the first language an operating system could be *written in* and then *moved* to a new machine.
* **The toolchain** (`make` 1976, version control 1972–2005) — the first tools that let a *team* build and keep software.
* **The GUI / the personal computer** (Smalltalk 1972, Alto 1973) — the first software that treated the *person* as the user, not the operator.
* **The library & framework** (1980s–now) — the first software that packaged *algorithms* for reuse.
* **The model** (2012–now) — the trained weights, the thing that predicts the next token.

We will climb this ladder from the bottom up, because that is the order the rungs were actually built, and because it is the only order in which the ideas make sense.
</div>

<figure>
    <img style="width: 100%" src="eniac.jpg" alt="The ENIAC, programmed by patching cables and setting switches" />
    <figcaption class="md">The ENIAC, first general-purpose electronic digital computer (1945). It had no stored program: a “program” was a physical rewiring of the machine, thousands of patch cables set by hand \cite{chm}.</figcaption>
</figure>

<div class="md">
## Programming by Hand (1943–1950): Before There Was “Software”

The word *software* barely existed in 1945. A “program” for the ENIAC was not a file. It was a **patch panel**: thousands of cables plugged into specific sockets, plus a bank of switches set by hand, that told the machine what circuit to compute. To run a *different* calculation you had to physically re-patch the machine, a process that could take days and was full of silent errors, because there was no place to *store* the instructions separately from the hardware. There was no such thing as an operating system, a compiler, or a “language,” because there was no boundary between the machine and its task.

This is the fundamental problem that the entire rest of this page is about solving: **how do you separate the *machine* from the *task* it is doing today?** Every subsequent invention — the stored program, the compiler, the operating system, the language — is a different answer to that same question.

The first step was the **stored program**. The idea — that the instructions could be *stored in the machine's memory* just like the numbers, and changed by loading new data — was set out in \citeauthor{vonneumann}'s \citeyear{vonneumann} *First Draft of a Report on the EDVAC* \cite{vonneumann}, which proposed a single memory holding both program and data, the **von Neumann architecture** that still describes most computers today. It was first *demonstrated* on the **Manchester “Baby”** (SSEM) at the University of Manchester, which on 21 June 1948 ran the first stored program, a small routine that found the largest factor of a 20-bit number \cite{chm}. A year later, **EDSAC** at Cambridge, built by **Maurice Wilkes** and his team, became the first *practical* stored-program machine \cite{chm} — and with it came the first two software concepts, both from Wilkes's team.

* **The initial orders:** a tiny fixed block of instructions that ran first and loaded the real program. This is, in embryo, the **operating system** — the machine bootstrapping itself before it can do anything a user asked for.
* **The subroutine:** the idea of a block of code you can *call* from many places and *return* from. Wilkes is said to have regarded the subroutine as the best idea he never got full credit for; it is the single most important abstraction in all of programming, the ancestor of the *function*.

The human story here is easy to miss. The ENIAC was programmed, for its first years, by a team of **six women** — Kay McNulty, Betty Holberton, Frances Spence, Marlyn Meltzer, Ruth Lichterman and Frances Bilas — who worked out, by hand, the timing and the patching of thousands of circuits. They were hired as “computers” (the word then meant a *person*), and for decades their names were left out of the record \cite{chm}. The first “software engineers” were women doing, with cables and switches, exactly the work the word *software* was later coined to describe.
</div>

<div class="optional md" data-headline="The moth: the origin of the word “bug”">
The most famous “bug” in computing history is a literal one. On **9 September 1947**, the team operating the **Harvard Mark II** relay computer found a moth caught in a relay, and taped it into the logbook with the annotation **“First actual case of bug being found.”** (The logbook page is in the Computer History Museum.) \citeauthor{chm} The word *bug* for a defect is older — engineers like **Thomas Edison** used it for mechanical faults decades earlier — but the moth is the image that stuck, and it is a perfect metaphor for the era: a physical, findable, removable fault, in a machine you could open up and look at. \cite{chm}
</div>

<div class="md">
## The First Operating Systems (1950s): The Machine That Manages Itself

A stored-program machine is a *better* calculator, but it is still a single-user, single-task device. If you feed it a job and the job spends forty minutes reading data from a slow tape, the fast CPU just **sits idle**, waiting. The obvious waste — and the obvious opportunity — was to let the machine **look after itself**: while one job's tape was churning, run another job's calculation.

That “look after itself” program is the **operating system**. Its job is not to *do* the user's calculation; it is to *manage the machine* — load the next job, move data between the fast memory and the slow tape, keep track of who owns what, and make the whole thing look like one continuous service. This is the purest form of the “extra level of indirection”: the user stops talking to the hardware and starts talking to an *agent* that talks to the hardware.

The first real operating system, by most accounts, was **GM-NAA I/O** (1956), built by **General Motors** together with **Northeastern University** to run a queue of jobs on an IBM 704 \cite{chm}. It was not a grand theoretical design; it was a *system program* that General Motors needed so that a stack of punched-card jobs could be loaded and run one after another with the tape handled automatically. Its historical importance is not its sophistication but its **existence**: it is the first documented case of a program whose sole purpose was to *manage the machine on behalf of other programs*. The “GM” in the name is the “GM/OS” that most histories skip straight past to Unix.

IBM followed with its own batch systems. The **IBM 701** (1952) shipped with one of the first **assemblers** (a program that translates short mnemonics like `ADD` into machine code), and the **IBM 704** (1959) ran **IBSYS** (the *Initial Binary Synchronous System*), IBM's first true operating system, which added a file system and batch job control \cite{chm}. Batch was the model: you handed a box of cards to the operator, came back the next day, and collected a box of printout. There was no interactivity, no “terminal.” You did not *use* the computer; you *submitted* to it. (The EDVAC, the machine \citeauthor{vonneumann}'s report had described, got its own dedicated first operating system, whose design IBM's **Charles H. Reitwiesner** documented in detail for the history of computing \cite{edvac_os}.)

The first break from batch was **timesharing**, and the machine that proved it was the **CTSS** (Compatible Time-Sharing System) at MIT, 1959–1961, led by **Jay Forbie** \cite{ctss_annals}. CTSS let many people sit at *terminals* and use the *same* computer at once, each getting the illusion of a private machine. In doing so it invented a stack of ideas we now take for granted: a **file system with access control** (you could *own* a file and stop others from reading it), **swapping** (move a whole user's workspace out to disk and back), **electronic mail**, **shared libraries**, and the concept of a **login** \cite{ctss_annals}. CTSS was built under the “Man–Computer Symbiosis” research program at MIT's Project MAC, funded by **J. C. R. Licklider**'s vision at ARPA — a vision we return to below, because it is one of the clearest early statements of what a computer is *for*: to extend the human mind, not to replace it \cite{licklider}.
</div>

<div class="optional md" data-headline="GM-NAA I/O: the machine that managed itself">
What is striking about GM-NAA I/O is how *unheroic* the first operating system was. There was no manifesto, no philosophy, no “do one thing well.” There was a car company in Detroit that had a pile of payroll and parts calculations and a machine that sat idle half the time, and a system program written to keep it busy \cite{chm}. The operating system was not conceived as an idea; it was conceived as a *scheduling problem*. That matters: the OS was born as **economics** (do not waste the expensive CPU), not as **aesthetics**. The beautiful, philosophical operating systems — Unix, Plan 9 — came later, and they could be beautiful precisely because someone had first solved the boring economic problem. \cite{chm}
</div>

<div class="md">
## Multics (1959–1969): The “Too Much” System

If CTSS was the proof of concept, **Multics** was the ambition. Starting in **1959**, a three-way collaboration between **Bell Labs**, **General Electric (GE)** and **MIT's Project MAC** set out to build the definitive timesharing operating system \cite{multics_plan9}. The goal was *everything at once*: true multi-user timesharing, hardware **memory segmentation**, a **hierarchical file system** with a directory structure, **security** and **access control** on every file, and **reliability** through redundant components. It was, in the words of its later critics, the first operating system that treated the computer as a *public utility* to be shared by thousands of people, safely.

Multics was, by every modern measure, *ahead of its time*. It had the features — the file tree, the permissions, the protection domains — that every serious operating system still has. And it was a **commercial failure**. It was enormously complex, expensive, and slow to deliver; it never really worked well on the GE hardware it was built for, and by the time the system was stable, the market had moved on to smaller, cheaper machines. When it finally shipped in 1969, it had perhaps a couple of dozen installations. The commercial verdict was in: Multics was *too much* \cite{multics_plan9}.

But this is the crux, and the most instructive failure in the history of computing. Multics was not *wrong*. It was *early and too large*. Almost everything good about it — the concept of a shared, protected, multi-user file system; the idea of *timesharing* as a service; the discipline of *security* as a first-class concern — did not die. It **migrated**. The engineers who found Multics overwhelming, and who wanted to build *smaller* things on the side, carried its ideas away in their heads and rebuilt them, stripped down, on a much cheaper machine. That “on the side” project was called **Unix**.

The psychology of Multics is worth pausing on, because it set up the central argument of Unix and of most software since. Multics was a **top-down** design: a committee of the world's best engineers, a comprehensive specification, an attempt to get *everything* right the first time, in a single monolithic system. It was the engineering ideal of the age — *comprehensiveness, correctness, a single perfect whole*. It was also, to the people on the team, a kind of art project, and the team culture (the “games” they built to test the graphics, the long dinners, the sense of building a cathedral) was real \cite{multics_plan9}. When it failed, it did not fail for lack of brilliance; it failed for the sin of **scale**. The lesson — *that a small, composable, imperfect system can beat a large, perfect, monolithic one* — became the founding creed of the Unix camp, and the argument has not been settled since.
</div>

<div class="optional md" data-headline="Multics and its games">
The Multics team did not just build a file system; they built a *culture*. To test the (then cutting-edge) display and input capabilities of their terminals, they wrote games. One of them, **Space Travel**, was a simple space-shooter, and it is the direct ancestor of the first “video game” to run on a time-sharing system. The crucial detail for our story: **Space Travel** was written by **Ken Thompson** and a colleague *as a game*, but when the Multics graphics were too slow and the hardware too costly to keep iterating on, Thompson took the game home and rewrote it on a cheap, discarded **PDP-7** that was sitting in a corner \cite{multics_plan9}. The operating system he wrote *around that game* to make it run — with its file system, its shell, its little kernel — is what became Unix. The most influential operating system in history was, in a very real sense, **a side project born from a game that the “serious” operating system was too slow to run**. \cite{multics_plan9}
</div>

<div class="md">
## Unix and the Hacker Ethos (1969–1973)

**Unix** was written at **Bell Labs** starting in **1969**, by **Ken Thompson** and (from about 1971) **Dennis Ritchie**, on that spare PDP-7 \cite{unix_ts}. Its name was a playful jab at Multics — a seven-letter pun, and a statement of intent: *the opposite of that over-engineered thing*. Unix was small. Its first kernel fit on a single page of documentation. It had a file system, a shell (a command interpreter, the first “sh,” written by Thompson himself), a few utilities, and — crucially — an attitude.

The attitude was later codified as the **Unix philosophy**, and it is an *ideology* as much as a technical style:

* **Do one thing, and do it well.** A program should be a small, sharp tool.
* **Build tools that work together.** Write programs that can be *combined*, piping the output of one into the input of another.
* **Text is universal.** Represent everything as plain text, so any tool can read any other tool's output.

The **pipe** — the `|` operator that connects the output of one program to the input of another — was added in **1973** by **Doug McIlroy**, and it is arguably the single most important idea in the design: it is the “level of indirection” made concrete. You do not need to know what the two programs do to each other; you only need to know they share a *vocabulary* (text) and a *contract* (one reads stdin, the other writes stdout). This is composition, and composition is the entire game \cite{unix_ts}.

But the thing that changed everything was not the pipe. It was **C**.

### C: The Operating System, Rewritten to Be Portable (1972)

Unix began in a language called **B** (1969, Thompson's own invention, a tiny precursor). In **1972**, **Dennis Ritchie** extended B into **C**, and in **1973** he and Thompson did something that had never been done: they **rewrote the operating system in the very language the operating system was compiling** \cite{unix_ts}. Before C, an operating system was written in the machine's own assembly language, which meant it was *locked to one machine*; to run it on a different computer you had to rewrite it from scratch. After C, the Unix kernel was **portable**: compile the same C source on a different machine and you get a working Unix for that machine.

This is a quiet, enormous deal, and it is worth stating plainly, because it is the *direct* ancestor of everything about modern software, including AI. **C made software relocatable.** It is the reason a “library” can be built once and used on a thousand machines. It is the reason the next 50 years of software — the compilers, the databases, the browsers, the GPUs' drivers, the frameworks, and the machine-learning libraries (NumPy, cuDNN, PyTorch's kernels) — could be *shared* rather than *rewritten*. The entire modern software economy rests on the assumption that a piece of code, written once, will run on many machines. That assumption is a 1973 Bell Labs decision \cite{unix_ts}.

The psychology of C is the psychology of the Unix group in a nutshell: **pragmatism over elegance, and smallness over power.** C is famously *bare*: it has almost no error checking, no object system, no “safety” — it gives you exactly the machine and nothing more. Purists of other languages have long mocked it (“C is not a high-level language; it is *portable assembly*”), and the mocking is half right. But that bareness is the *feature*. C is “assembly that you can take with you,” and it is the reason the *same* low-level performance you get from writing to the metal is also the language you use to build the *infrastructure* on top of which everything else runs. When a machine-learning framework needs to squeeze the last flop out of a GPU, it descends to C and CUDA; the high-level Python on top is the *interface*, and C (and the assembly it lowers to) is the *work*.
</div>

<div class="optional md" data-headline="“Glory”: the Unix group in a single word">
When asked, years later, to describe the feeling of writing Unix, the members of the Bell Labs group gave a one-word answer that has become a kind of password for the hacker identity: **“Glory.”** The joke was that the motivation for the work was not the paycheck (Bell Labs was a research lab, not a product company) and not the users (there were barely any), but the *satisfaction of the thing working*. Unix was built because building a clean, small, composable system was *fun*, and the fun was the point \cite{bell_labs}. This is the seed of the **hacker ethic** — the belief that the intrinsic pleasure of making a clever, working thing is a legitimate, even primary, motivation — and it is a motivation that has powered most of the “open” side of software ever since. \cite{unix_ts}
</div>

<div class="md">
## The Unix Wars, and the Idea of a Standard (1979–1990)

A portable, powerful, well-liked operating system was, commercially, a *dangerous* thing for AT&T, because Bell Labs (part of AT&T) was not allowed to *sell* Unix. That opened the door. Universities and vendors began shipping their own versions, and within a decade there were two incompatible families: the **Berkeley Software Distribution (BSD)**, out of the University of California, Berkeley (which added the socket interface for networking and the famous `csh` and `tcpdump`), and **System V**, AT&T's commercial line \cite{unix_ts}. They were *Unixes* in the cultural sense but *incompatible* in the technical one — a program written for one often would not run on the other.

The response was **POSIX** (Portable Operating System Interface), a set of standards published in the 1980s that defined a *common* Unix: the same system calls, the same command-line tools, the same shell semantics, on every machine \cite{unix_ts}. POSIX is one of the first big acts of *standardization* in software, and it is a small miracle that it worked at all, because standardization is the natural enemy of the Unix hacker ethos (which prefers to *invent* the next tool rather than agree on one). The tension — **open invention versus agreed standard** — is the tension that runs through all of software, and it is a tension we will see again, and again, in the languages and in the open-source movement.

The “wars” were also, and this is the part that belongs in the psychology, a **war of identities**. The BSD camp was *academic and free* (they gave the code away); the System V camp was *commercial and closed* (you bought a license). The same two poles — *open and academic* versus *closed and commercial* — that produced the Unix wars went on to produce the entire modern map of the software industry, from the free-software movement to the proprietary empires, from open-source Linux to the walled gardens. The operating system was the first battleground, and the battle never really ended; it just changed fronts.
</div>

<div class="md">
## Plan 9 and Inferno: The “Start Over” Operating System (1990s–2000s)

In the early 1990s, some of the original Unix people at Bell Labs — Thompson, **Rob Pike**, and a few others — did what purists do when the original idea has, in their view, been corrupted by decades of add-ons: they **started over from scratch** \cite{multics_plan9}. The result was **Plan 9 from Bell Labs** (often just “Plan 9,” a nod to the ninth edition of Unix, and to a long-running Bell Labs joke).

Plan 9 took the Unix idea — *“everything is a file”* — and pushed it to its logical extreme. In Unix, files, devices, and (later, via sockets) network connections were given a *file-like* interface. In Plan 9, *everything* was a file: a window on your screen, a device, a process, a connection to a machine across the network — all addressed the same way, through the same small set of operations, over a single, simple protocol called **9P** \cite{plan9_9front}. The idea was radical **simplicity**: one idea, applied uniformly, instead of a dozen special cases. A program on one machine could open a file on another machine with exactly the same call it used to open a local file.

Plan 9 was, like Multics before it, *ahead of its time* and never commercially successful \cite{multics_plan9}. But it is beloved by exactly the kind of people who love it, and its descendants are alive today. The community that keeps it going (and a cleaner reimplementation called **9front**) maintains it as a working system and as a *philosophical statement* \cite{plan9_9front}. And in **2000**, the same group turned Plan 9 into **Inferno**, a system with its own **virtual machine** and its own high-level language, **Limbo** (a safe, garbage-collected successor to C), aimed at *embedded* and *media* applications \cite{plan9_9front}. Inferno's most visible (and, to its fans, most delightful) feature was its color: the whole user interface, the windows, the text, everything, was rendered in **blue** — a deliberate, almost aesthetic choice that made an Inferno machine unmistakable at a glance \cite{plan9_9front}.

The story of Plan 9/Inferno is a caution and a compliment at once. It is a **compliment** to the Unix people: they could, and did, take their own idea to its purest form and make it *work*, and in doing so they produced one of the most elegant operating-system designs ever conceived. It is a **caution** because it shows the cost of that purity: a system so clean and so “correct” that the rest of the world, busy building incompatible things, simply drove past it. The “one true operating system” is a beautiful idea and a doomed product, and the people who built it knew it; they built it anyway, because building it *was* the point.
</div>

<div class="optional md" data-headline="Why is it called “Plan 9”?">
The “9” in Plan 9 is a Bell Labs in-joke that rewards a little lore. Unix has had numbered “editions” since the early days (1st edition 1971, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th), and the **8th edition** of Unix was the last “classic” one, a snapshot of the system in the early 1990s. A “9th” edition was therefore the *next* thing — the future — and naming the new project “Plan 9” said, in one number, *this is what Unix is going to become* \cite{plan9_9front}. The joke deepens for those who know the reference: the number nine recurs in the project's culture (the protocol is **9P**, the implementation **9front**, even the tape format **9tape**), part humor and part a kind of quiet cult around a single, lucky, arbitrary number. \cite{plan9_9front}
</div>

<div class="md">
## The Personal Computer and the Operating-System War (1974–1995)

By the mid-1970s, the microprocessor made a *whole computer* cheap enough to fit on a desk, and with the personal computer came the first *consumer* operating-system war.

### CP/M: The First Microcomputer OS (1974)
The first popular microcomputer operating system was **CP/M** (Control Program/Monitor), written in 1974 by **Gary Kildall** at **Digital Research** for the 8-bit Intel 8080. It was the default OS on hundreds of thousands of small machines, from the Altair to the Apple II, and it defined, in miniature, the model that followed: a tiny kernel, a disk file system (the `.COM`, `.EXE`, `.SYS` file types still echo it), and a command line \cite{chm}.

The story of CP/M meeting IBM is one of the great “what-ifs” of the industry. In 1980, IBM was designing its first personal computer and needed an operating system. It approached Digital Research about **CP/M-86**, a 16-bit version. The famous (and fiercely disputed) anecdote has Kildall unavailable for the key meeting because he was water-skiing, and an IBM engineer walking away and instead talking to **Microsoft** \cite{chm}. Whether or not the water-skiing is literally true, the *consequence* is not in dispute: IBM licensed its PC's operating system from Microsoft, not from CP/M's author. The result made Microsoft, and it made the next twenty years of computing.

### MS-DOS and the IBM PC (1981)
What Microsoft sold to IBM was not, at first, even a serious operating system. Tim Paterson at **Seattle Computer Products** had written a small 86-DOS for a client; it was thin, quick, and unfinished. Microsoft bought it for a reported **fifty thousand dollars**, reworked it, rebranded it **PC-DOS**, and licensed it to IBM as **MS-DOS** \cite{chm}. The **IBM PC**, released in August 1981, used it.

Two decisions in that contract shaped the industry. First, Microsoft kept the *rights* to the OS and licensed it to *other* manufacturers as well, not just IBM — a small clause that turned MS-DOS into the OS of the *entire* PC market, not just IBM's. Second, IBM did **not** patent its **BIOS** (the basic firmware that boots the machine), so others could *clean-room* reverse-engineer it and build “PC-compatible” clones, from Compaq up \cite{chm}. The result was the **Wintel** standard: Intel's CPU plus Microsoft's OS, cloned by everyone, the dominant platform of the personal-computer era, and the platform on which the first wave of consumer software — and, later, the first wave of desktop AI tools — was built \cite{windows_ms}.
</div>

<div class="optional md" data-headline="MS-DOS was a side project">
It is a detail that is easy to miss and worth stating, because it is the difference between a product and a *bet*: at the time Microsoft licensed DOS to IBM, **DOS was not the company's main product**. Microsoft's first product was **Altair BASIC** (1975, written by Bill Gates and Paul Allen for the first personal computer kit), and the company's center of gravity was on software for the emerging PC as a *market*, not on the operating system. DOS was a quick, cheap acquisition to *have* an OS to hand to IBM; it was meant to be the *hook*, not the *prize* \cite{chm}. The fact that the hook became the most profitable piece of software in the history of the world is one of the great ironies, and it is a pure function of *timing and positioning* rather than of technical superiority — MS-DOS was, by any engineering measure, a *worse* operating system than the alternatives on the market. \cite{windows_ms}
</div>

<div class="md">
### OS/2: The Collaboration That Ate Itself (1987)
The most instructive operating-system failure of the PC era was not a failure of technology but a **failure of trust**. In the mid-1980s, **IBM and Microsoft** decided to build a *real* 32-bit operating system *together*, a successor to DOS that could do preemptive multitasking, protected memory, and a proper graphical interface. The result was **OS/2**, released in 1987 \cite{windows_ms}.

For a time it looked like the future. OS/2 was, technically, a *better* operating system than the DOS that was about to dominate: it was 32-bit, it had true preemptive multitasking, it had a real memory model, and its **Presentation Manager** GUI was ahead of its time \cite{windows_ms}. And then the two partners pulled in opposite directions. **IBM** decided OS/2 was *the* future and went all-in on it, building the powerful **OS/2 Warp** (1994). **Microsoft**, meanwhile, did something far simpler and far more effective: it bolted a graphical shell, **Windows 3.0** (1990), *on top of the existing DOS*, and let it run on the *huge* installed base of cheap PCs that OS/2 did not. Windows was, engineering-wise, a patch on a 16-bit machine; but it was *cheap, familiar, and already installed*, and it won \cite{windows_ms}.

The fallout was a long, bitter legal and commercial dispute that ran through the 1990s, and it is a case study in how a *technically superior* system loses to a *strategically positioned* one. OS/2 Warp was a good, fast, solid operating system that sold to almost no one, and it is remembered mainly as the *near-miss* — the OS that, had its two creators pulled in the same direction, might have been the Windows we all use. The lesson belongs in the psychology: the operating-system business was never decided by the *best* kernel. It was decided by **distribution, backward compatibility, and the willingness of one partner to do something the other had not authorized**.
</div>

<div class="md">
### Windows and NT: The Kernel Built by a Small Team of the Best (1985–1995)
**Windows 1.0** (1985) was a graphical shell over DOS; it was useful but fragile. **Windows 3.0** (1990) and **3.1** (1992) made it *good* — a real graphical environment, VGA color, the file manager and the programs people actually wanted — and they made the PC a mass-market machine \cite{windows_ms}. But under the hood it was still DOS, 16-bit, and the engineers at Microsoft knew it was a *temporary* structure.

So, in parallel, Microsoft built a *real* operating system from the ground up: **Windows NT** (1993), the “New Technology” kernel. The decisive move was hiring **Dave Cutler**, the architect of the *other* side of the OS/2 story (at Digital Research), and a small team of some of the best systems engineers in the industry, to write it \cite{windows_ms}. NT was 32-bit, preemptive, portable across several CPUs, and *secure* in a way DOS and its Windows shell never were. It was the “serious” Microsoft operating system, and it is the direct ancestor of every modern Windows (and of the security model of much of the server world).

The strange, telling fact is that for a *decade* Microsoft ran **two** operating systems in parallel: the *popular* one (Windows 95, 98, ME — still DOS at its core) and the *serious* one (NT, 2000, XP — the real kernel). **Windows 95** (1995) was the cultural event: the Start button, the graphical shell, plug-and-play, and a launch that was a genuine moment in consumer technology \cite{windows_ms}. It was, technically, the *lesser* of the two; it won on *familiarity and price*. The two lines finally merged in **Windows XP** (2001), which put the *popular* Windows shell on the *serious* NT kernel. The modern Windows — and, through it, the platform that a huge share of the world's AI software was first written and tested on — is the *descendant of that 1993 bet by a small team* \cite{windows_ms}.
</div>

<div class="optional md" data-headline="The browser wars: the OS war, again, in a new costume">
The operating-system war of the 1980s did not end with the Wintel standard; it simply moved *up* a layer, into the **browser**. In the mid-1990s, **Netscape** (Netscape Navigator) and **Microsoft** (Internet Explorer) fought a ferocious, industry-defining fight for the default browser, a fight that was really a fight for *the new front door to the computer* \cite{windows_ms}. Microsoft's move — bundling the browser *with* the operating system — was so decisive, and so legally controversial, that it became the core of the first great antitrust case against a software company. The pattern is identical to the OS/2 story: the *better* product did not win; the product that was *already there*, that *cost nothing*, that the user did not have to think about, did. And the *idea* that was born in that war — that the *browser* is the new universal application platform, the new “operating system” of the internet — is the idea that made the *web* a place where software (including, eventually, web-based AI tools) could run *anywhere*, without installation. \cite{windows_ms}
</div>

<div class="md">
## The Other Operating Systems (the “and so on and so forth”)

Unix, Windows, and their war are the famous thread. But the space was crowded, and several *other* operating systems made contributions that are easy to skip and hard to replace.

* **VAX/VMS (1977, DEC).** Digital Equipment Corporation's VMS was the “Swiss Army knife” of the 1980s: a powerful, preemptive, multi-user operating system with *excellent* security, virtual memory, and fault tolerance, running on the VAX minicomputer \cite{chm}. It was the default on a huge number of scientific and commercial sites, and its *security model* (mandatory access control, the idea that the *system* — not the user — enforces who can read what) influenced the security design of systems that followed. The psychology of VMS is the psychology of DEC: a company that built *machines* for the people who actually *used* computers, in a culture that prized *reliability* over *elegance* \cite{chm}.
</div>

<div class="md">
* **Mach (1983, CMU) and the microkernel.** At Carnegie Mellon, **Avie Tevanian** (and a team) built **Mach**, a **microkernel** — an operating system in which the *kernel* is deliberately *tiny* (only the absolute minimum: scheduling, basic memory, basic I/O), and everything else (file systems, device drivers, the network) runs *outside* it, in user space \cite{mach}. The argument was that a small, simple, *verifiable* core is easier to get *right* than a large, monolithic kernel, and that everything else can be *replaced* without touching the core. This set off a famous, decades-long debate — the **microkernel versus the monolithic kernel** argument — between the purists (who wanted the clean microkernel) and the pragmatists (who said the monolith is *faster* and the “clean” version is a *theoretical* nicety). The debate was played out publicly, in print, in the mid-1980s, and it has never been fully settled \cite{chm}.
</div>

<div class="md">
Mach matters because it did not die in a journal. It became the *kernel* of **NeXTSTEP** (1989), the operating system of **Steve Jobs's** NeXT computer, which combined the Mach microkernel with a **BSD** user space and an **object-oriented** system built around **Objective-C** \cite{chm}. NeXTSTEP had a beautiful, consistent graphical interface (later **Aqua**) and a *modern* object model, and when Apple bought NeXT in 1997, NeXTSTEP became the foundation of **macOS** (and, with it, of **iOS**). So the microkernel that a CMU team built as a *research* kernel is, today, the *basis of the operating system on a billion phones* \cite{chm}. The “pure” research idea won — not by being *chosen*, but by being *bought*.
</div>

<div class="optional md" data-headline="The microkernel debate: purity versus speed">
The Tanenbaum-versus-Lampson argument (Andrew Tanenbaum for the microkernel, Butler Lampson for the monolith), published in *Byte* magazine in 1986, is a document worth reading for what it reveals about how engineers *disagree* \cite{chm}. Both sides were *brilliant* and *right*, about different things. The microkernel people were right that a small core is *easier to verify and harder to crash*; the monolith people were right that the *extra context switches* in a microkernel make it *slower* for the common case. The resolution that history arrived at is a *hybrid*: a *small* core, with the *most performance-critical* pieces (the file system, the network) *pulled back inside* it. Modern kernels — including the Linux kernel and the kernel of the Mac — are, in practice, *monoliths that learned a little from the microkernel*, and the argument is a perfect example of a *technical* debate that is really an *aesthetic* one: do you value *clean correctness* or *measured speed*? \cite{chm}
</div>

<div class="md">
* **GNU Hurd (1991, the free operating system).** **Richard Stallman**'s **GNU** project set out to build a *complete, free* operating system — one whose every part could be studied, copied, and modified. The kernel of that system, the **Hurd** (HURD, a name that is its own backronym), was built on top of Mach \cite{gnu_hurd}. The Hurd is famous for one thing above all: it has been *“almost done”* for decades. The phrase “the GNU Hurd will be done, and then it will be free” became a running, affectionate joke in the free-software world — *done* in the sense of “functioning,” but never in the sense of “the default thing people actually run” \cite{gnu_hurd}. The Hurd is a monument to an *idea* (a completely free, user-controlled system) that outran its *execution*, and it is the flag of the **free-software** movement, for which the *freedom* of the software is the point, not the *convenience* \cite{gnu_hurd}.
</div>

<div class="md">
* **Amiga OS (1985, Commodore).** The Amiga was the machine that *should have* eaten the world. Running on a Motorola 68000, its operating system offered, in **1985**, **preemptive multitasking**, a true **graphical user interface** (Intuition), and a multi-channel audio system, on a *consumer* machine that cost less than the business computers of the day \cite{chm}. It was the platform of a generation of computer musicians and demoscene artists, and its OS was, for its price class, *years* ahead. It failed for *business* reasons (Commodore's management, not the technology), and it is remembered as the great *what-if* of the home computer: a *real* multitasking graphical OS, in a living room, before the IBM PC had one \cite{chm}.
</div>

<div class="md">
* **BeOS (1990, and the media-oriented computer).** **Be Inc.** (founded by Steve Balestra, and later led by **Jean-Louis Gassée**, who had been a senior executive at Apple) built an operating system explicitly aimed at *multimedia*: a fast, preemptive, threaded design that treated *media* — video, audio, the user interface — as first-class citizens, and that could run a 3-D “Media Transport” in real time \cite{chm}. Be never became a mass-market OS, and the company was eventually acquired by Google (2005) primarily for its *people* and its *code*. BeOS is a reminder that the operating-system space was never a two-horse race; it was a *bazaar* of visions, each one a different answer to “what is a computer *for*?” — for Be, the answer was *media*, and for a moment it looked like the right answer for the coming web \cite{chm}.
</div>

<div class="md">
* **MINIX (1987, the teaching operating system).** **Andrew Tanenbaum** wrote **MINIX** with a deliberately different goal: not to be the *best* operating system, but to be the *smallest one you can actually teach* \cite{minix3}. It was small enough that a student could *read the entire kernel* in a semester, and he used it to argue his side of the microkernel debate (MINIX 3 became a true microkernel) \cite{minix3}. Its importance is *educational*: for a generation, MINIX was the *textbook* operating system, the one students actually *read* and *modified*, and the people who learned to think about kernels by reading MINIX went on to build the real ones \cite{minix3}.
</div>

<div class="optional md" data-headline="VxWorks and the Mars bug that cost a spacecraft">
The most dramatic proof that an operating-system bug can *ground a spacecraft* is the **Mars Pathfinder** (1997). The lander ran on **VxWorks**, a real-time operating system, and a few minutes after touchdown it *lost contact* — a failure that was traced, in a now-classic post-mortem, to a **priority-inversion** bug, a flaw in how the OS *ordered* the tasks it was running. A *low*-priority task held a lock that a *high*-priority task needed, and a *medium*-priority task jumped in line, so the high-priority task (which had to watch the lander's systems) was *starved* — a textbook real-time failure, caused by an *off-the-shelf* OS feature that had not been configured for the worst case \cite{mars_pathfinder}. The fix — a **priority-inheritance** mutex, a well-known, cheap, *textbook* correction — would have prevented it. The story is told in every real-time operating-system course as the ultimate argument for *boring, correct, conservative* operating-system design: the most sophisticated software on Mars was defeated not by the physics of Mars, but by a *scheduling bug in the software that managed the software*. \cite{mars_pathfinder}
</div>

<div class="md">
And the rest, briefly, so the map is complete: **RISC OS** (Acorn, the clean, elegant OS of the ARM microcomputer); **QNX** (the *embedded* operating system that, quietly, runs in a large share of the cars, medical devices, and industrial controllers around the world — the OS you *never* see because it is *inside* things); **pSOS** (Apple's short-lived microkernel experiment); **Xenix** (Microsoft's Unix, before the company found its destiny in Windows); and **SCO UNIX** (one of the many “Unixes” of the wars). Each was a different answer to the same question, and each left a scar on the design of the systems that survived \cite{chm}.
</div>

<div class="md">
## Programming Languages: The Development of a Way of Thinking

If the operating system is the *machine that manages itself*, the programming language is the *way a human talks to it*. And the history of programming languages is, more than any other part of software, a history of *ideas about thinking*: what is a *computation*? what is a *function*? what is a *value*? which abstractions are *honest* and which are *lies*? Each major language is a *thesis*, and the “winning” language of an era is the thesis that most people found *bearable*.

The languages were not invented in the order we use them. They were invented in the order of *ambition*: first to *save the labor of coding* (FORTRAN), then to *express mathematics* (Lisp, ALGOL), then to *build systems* (C), then to *build objects* (Simula, Smalltalk, C++), then to *build anything* (the modern polyglot era). Let us go in that order.
</div>

<div class="md">
### The First Languages (1950s): Saving the Labor of Coding

The first high-level language was not *elegant*; it was *economic*. In 1957, a team at IBM led by **John Backus** built **FORTRAN** (FORmula TRANslation), the first language that let a *scientist* write a calculation in a form close to the *mathematics* (a sum, a loop, a formula) instead of in machine code \cite{fortran2}. The claim that sold it — that a FORTRAN program ran as fast as, or faster than, hand-tuned assembly, while taking a fraction of the time to *write* — was, for the first time, *credible* \cite{fortran2}. FORTRAN is *still* the language of a huge amount of scientific and numerical computing; the *computational kernel* of much of modern numerical software is, literally, FORTRAN, wrapped in newer languages.

In the same era, **Grace Hopper**'s group at the Navy was doing the other half of the revolution: *compilation* itself. Hopper's **A-0** system (1952) was the **first compiler** — a program that *translated* a high-level language into machine code automatically, instead of the programmer writing the machine code by hand \cite{chm}. Hopper *coined the word “compiler”* and, more importantly, she *preached the idea* that programming should be *independent of the machine*: that a person should write for *the problem*, not for *this particular computer*. That is the entire philosophy of high-level programming in one sentence, and it is the reason we can write Python on a machine that did not exist when we learned it \cite{chm}. Hopper's **FLOW-MATIC** (1959), a business language with an *English-like* syntax, became the basis of **COBOL** (1959), the language of *bookkeeping*, which — and this is a fact that surprises people — is *still* running a large share of the world's banking and insurance systems, half a century on \cite{chm}.
</div>

<div class="optional md" data-headline="Grace Hopper and the word “compiler”">
Grace Hopper is one of the great *translators* in the history of the field, in both senses. She built the *first compiler*, but she also *translated the idea of the computer* from “a machine for people who can read its guts” into “a tool for people who can state a problem” \cite{chm}. Her insistence that the language should be *close to English* (“why should the computer speak a language only its builder understands?”) was a *sociological* insight as much as a technical one: the *limiting* resource was not the machine, it was the *number of people who could program it*, and the only way to get more programmers was to make the language *bearable to non-specialists* \cite{chm}. That insight — *that the value of a language is the size of the set of people who can use it* — is the insight behind BASIC, Python, and, in a different way, behind the *natural-language* interface of modern AI. \cite{chm}
</div>

<div class="md">
### Lisp (1958): The Language That Treated Computation as Mathematics

In **1958**, **John McCarthy** at MIT invented **Lisp** (LISt Processing), and it was a *different kind of thing* from FORTRAN. Where FORTRAN was a language for *numbers*, Lisp was a language for *symbols* and *functions*, built directly on the **lambda calculus** of **Alonzo Church** (1930s) — the mathematical theory of *functions as first-class objects*. In Lisp, a *function* is a *value*: you can pass it around, return it, build new functions out of old ones. The whole language is, essentially, a small *calculus*, and it was the first language that treated *computation itself* as a *mathematical object* to be manipulated \cite{lispworks}.

Lisp invented or popularized a stack of ideas that are now *everywhere* but whose origins are in 1958: the **automatic garbage collector** (1959, the memory that cleans itself up, so the programmer never has to free it), the *first-class function*, the *recursive* definition, and the *dynamic* type \cite{lispworks}. And it created a *culture*: the MIT **Lisp machine** (a computer designed from the ground up to run Lisp) and the **hacker** subculture that grew up around it, for whom the *pleasure* of the language — its *elegance*, its *power*, its “way of thinking” — was the point, not the *application*.

The psychology of Lisp is the psychology of **McCarthy**, who was, by all accounts, *magnificent and difficult*. In 1959, in an essay, he predicted that *within a decade* computers would be as intelligent as human beings — a prediction that was *spectacularly* wrong about the *date* and has, in a sense, been *spectacularly* right about the *event*, some six decades later \cite{lispworks}. The *idea* that a machine could *think*, stated by a *logician* in 1959 as a *matter of course* (“of course we will, it is just engineering”), is one of the founding intuitions of artificial intelligence, and Lisp is the language in which that intuition was first *programmed*.
</div>

<div class="md">
### ALGOL (1958/1960): The Language That Taught Us *Structure*

If Lisp was the *mathematical* language, **ALGOL** (ALGOrithmic Language, 1958, and the **ALGOL 60** report of 1963) was the *structured* one \cite{algol60}. ALGOL was designed by a committee with a *deliberate* goal: to make programming *readable* and *correct*, by giving the language a real *structure*. It introduced, or consolidated, the ideas that every “structured” language since has inherited: **block structure** (a program is a tree of *blocks*, each with its own *scope*), **lexical scoping** (a variable is visible in exactly the block where it is defined and the blocks nested inside it), and **structured control** (`if`, `for`, `while`) \cite{algol60}.

ALGOL's deepest contribution was a *theorem*, proved in 1966 by **Böhm and Jacopini**: that *any* computable program can be written using just *three* control structures — *sequence*, *if*, and *while* — with no `goto` at all \cite{goto_harmful}. That result turned the *style* of programming into a *mathematical* question, and it set the stage for the most famous essay in the history of software.
</div>

<div class="smart-quote" data-cite="goto_harmful">
    <div class="full-quote">I propose that, as a first step, we all refuse to use the <em>go to</em> statement (in a “high-level language”), insist that better methods be found for handling these problems, and then try to convince the rest of the world that this, too, is part of our job as professional programmers.</div>
    <div class="short-quote">“Go to statement considered harmful” — the essay that made *structure* a moral duty.</div>
</div>

<div class="md">
In **1968**, **Edsger Dijkstra** wrote, to a friend, the letter that became **“Go to Statement Considered Harmful”** \cite{goto_harmful}. The argument was *small* and *enormous* at once: the `goto` (the unconditional jump, the “go to line 47”) was not merely *ugly*; it was *dangerous*, because it let a program's *control flow* become a *spaghetti* that no human could *follow*, and a program no human can follow is a program no human can *prove correct*. The essay is a *rhetorical* masterpiece as much as a technical one, and it did what very few pieces of writing in computing have done: it *changed the way a whole profession thought about itself*, by turning *style* into *professionalism* \cite{goto_harmful}. “Structured programming” — the idea that a program should have a *clean, provable* structure — is a direct child of that letter, and the *idea* that *the readability and correctness of the code is a first-class engineering concern* (not a cosmetic one) is one of the lasting contributions of the 1960s to the discipline. It is also, quietly, an *AI* contribution: the insistence that a system be *understandable by a human* is the same insistence that, decades later, would drive the demand for *interpretable* and *explainable* models.
</div>

<div class="md">
### C, C++, and the Systems Languages (1970s)
We met **C** (1972, Ritchie) in the Unix story; it is the *systems* language, the “portable assembly,” the language in which the operating systems, the compilers, the databases, and the *low-level* half of everything is built. Its standards (C89 in 1989, then C99, C11, C17, and C23) froze and extended the language that a *whole industry* had been building on \cite{unix_ts}.

**C++** is the *argument* about what C should have been. **Bjarne Stroustrup** at Bell Labs began in 1979 with “C with Classes” — the idea of taking the *bare* C and adding an *object model* on top of it — and it grew, over the 1980s and 1990s, into a *large* language that tries to be *everything at once*: low-level *and* object-oriented *and* generic, systems *and* application \cite{isocpp}. C++ is *contested* in a way that few languages are — its *power* is its *complexity*, and its *complexity* is its *bug* — but it is also *indispensable*: it is the language of the *game engines*, the *browsers*, the *databases*, and a *very large* share of the *high-performance* half of machine learning (the C++ and CUDA kernels under the Python frameworks) \cite{isocpp}. The psychology of C++ is the psychology of *refusal to choose*: it is the language for people who are not willing to give up *either* the *control* of C *or* the *convenience* of the high-level, and who are willing to pay, in *complexity*, for having both.
</div>

<div class="md">
* **Pascal (1970, Niklaus Wirth).** Wirth designed **Pascal** as a *teaching* language, and he *succeeded* so well that it became *the* language of the first generation of students for a decade \cite{pascal}. Pascal took ALGOL's *structure* and made it *pedagogical*: a small, clean, *honest* language in which a student could see *exactly* what the program does. Wirth went on to **Modula** and **Oberon**, languages that pushed the *modular*, *small* design further, and his influence is the influence of the *idea* that a language should be *small enough to be understood* \cite{pascal}.
</div>

<div class="md">
* **Simula (1967, Norway): the first object-oriented language.** In Norway, **Ole-Johan Dahl** and **Kristen Nygaard** built **Simula** (first Simula 67) to *simulate* real-world systems, and to do so they invented the *object*: a *thing* that bundles its *data* and its *behavior* together, and the *class* (a *template* for making many such things), and *inheritance* (one class *extends* another) \cite{chm}. **Simula is the first object-oriented language**, and the *object* — the idea that the basic unit of a program is a *self-contained thing* that *hides* its innards and *shows* an interface — is the single most *diffused* idea in the history of programming languages. Every `class` in every language since, and the whole *object-oriented* paradigm (Java, C++, Python, Swift), is a *descendant* of Simula 67. That a *simulation* language, built to model *queues and factories*, gave the world the *object* is one of the great examples of an *idea escaping its intended use*. \cite{chm}
</div>

<div class="md">
* **Smalltalk (1972, Alan Kay) and the Dynabook: the Operating System for the *Person*.** This is the single most important *side* story in the history of software for our purposes, because it is where the *computer stopped being a machine for operators and became a machine for people*. At **Xerox PARC**, **Alan Kay** and his team built **Smalltalk** (1972), a *pure* object-oriented language (dynamically typed, fully object-based, *no* globals), and — more importantly — they built it *on a machine with a mouse and a screen*. The **Xerox Alto** (1973), the *first* computer with a *graphical user interface* and a *mouse*, ran Smalltalk, and it is the *direct ancestor* of the Apple Lisa (1983) and the **Macintosh** (1984) \cite{smalltalk}.

Kay's *vision* for why he was doing all this was not “faster calculations”; it was the **Dynabook** — a concept he articulated in the late 1960s and refined for decades: a *personal* computer, *light* enough to carry, *powerful* enough to *teach a child*, with a *graphical* interface, that could be a *tool for thinking*, for *writing*, for *learning* \cite{smalltalk}. The Dynabook is, in effect, a *1968 sketch of the tablet and the laptop and the “personal computer” and the “AI tutor” all at once*. It is a sketch of *exactly the kind of machine* that a modern AI assistant is trying to be: a *personal*, *graphical*, *learning* tool, *for a person*, *at the desktop*. The fact that the *idea* of the personal, graphical, learning computer was *stated, clearly, in 1968* — and that the *technology* (the Alto, Smalltalk) to build it *existed* in 1973 — and that it *took twenty more years* to become a product (the Mac, in 1984) is one of the great *gap* stories in the history of the field: the *idea* was there, the *prototype* was there, and the *market* was not \cite{smalltalk}.
</div>

<div class="optional md" data-headline="Xerox PARC: the ideas that were almost products">
Xerox PARC is the *Rosetta Stone* of the “ahead of its time” story. In the 1970s it produced, in *working form*, the *mouse*, the *graphical user interface*, *Ethernet* (the network), *laser printing*, and *object-oriented programming* (Smalltalk) — and Xerox, the company that owned it, *never shipped most of them as products* \cite{chm}. The *ideas* escaped, and they were *adopted* by Apple (the GUI, via the Alto, via Jobs's visit in 1979) and by the *networking* world (Ethernet) and by *every* object-oriented language since (Smalltalk). PARC is the purest example of a *research* institution producing *product-defining* ideas that its *owner* could not *monetize*, and of *ideas* being worth more than the *products* that fail to carry them. It is also, quietly, an *AI* story: the *personal computer* that PARC imagined — a *learning*, *graphical*, *personal* tool — is the *form factor* in which modern AI *lives*. \cite{smalltalk}
</div>

<div class="md">
* **ML, Haskell, and the pure-functional camp (1973–1990).** **ML** (1973, from the Lisp world, but *typed*) and its descendants (**Standard ML**, **OCaml**, **F#**) were built around a single, *powerful* idea: **type inference**. In 1978, **Robin Milner** (with **Hindley**) showed that a program's *types* could be *figured out automatically* by the compiler, so the programmer *did not have to write them* — a *proof* about the program, done *for you*, at *compile time* \cite{haskell}. **Haskell** (1990) pushed the *functional* idea to its *pure* limit: a *lazy* (compute only what you need, when you need it), *pure* (no side effects, the same input always gives the same output) language, in which a *function* is the *only* thing and a *program* is a *mathematical expression* \cite{haskell}. Haskell is named for **Haskell Curry**, the logician whose work on *combinators* (and the **Curry–Howard correspondence**, the deep link between *programs* and *proofs*) is the *mathematical* foundation of the whole *typed-functional* tradition \cite{haskell}. The *psychology* of this camp is the *psychology of the mathematician*: the *purity* is the *point*; a *side effect* is a *sin*; a *proof* is a *program*; and the *beauty* of the *type system* is a *moral* good. It is the *idealist* pole of the language world, in permanent, productive *tension* with the *pragmatist* pole of C and C++.
</div>

<div class="md">
* **Prolog (1972, Marseille): the language of *logic*.** In France, **Alain Colmerauer** (with Philippe Roussel) invented **Prolog** (PROgramming in LOGic), a language in which you do not *tell* the computer *how* to do something; you *tell* it *what is true* (a set of *facts* and *rules*), and you *ask* it a *question*, and it *works backward* (by *logic*, by *unification* and *backtracking*) to *find* an answer \cite{prolog}. Prolog was the *flagship* language of the *symbolic AI* and the *expert systems* of the 1980s, and it is the language that *most directly* embodies the *old* idea — the *Leibniz*, the *Llull*, the *Boole* idea, the idea that *reasoning* is *symbol manipulation* — that this whole course has been tracing. It *lost* the argument to *statistical* methods (to the neural networks, to the “bitter lesson”), but it did not *die*; it lives on in *database* query languages, in *logic* programming, and in the *neuro-symbolic* attempt to bring *structure* back into *learning* systems \cite{prolog}.
</div>

<div class="md">
* **APL (1958, Kenneth Iverson): the language of a *single notation*.** **APL** (A Programming Language) was built, by **Kenneth Iverson**, around a *single, dense, symbolic notation* — a *keyboard* of special *symbols* (the “APL keyboard”) in which an *entire* calculation could be written on *one line* \cite{apl_j}. APL is *unbearable* to most people (the notation is a *barrier*) and *extraordinary* to its fans (the *conciseness* is a *superpower*), and it is the *purest* example of a language as a *notational system*: the *whole* of the language is a *notation*, and the *value* of the language *is* the *value* of the notation. Its descendants (**J**, and the *vector* operations that became *NumPy*) carried the *idea* — *compute on whole arrays at once, not element by element* — into the *center* of modern numerical computing \cite{apl_j}.
</div>

<div class="md">
* **BASIC (1964, Dartmouth): the language *for everyone*.** **John Kemeny** and **Thomas Kurtz** at **Dartmouth College** invented **BASIC** (Beginner's All-purpose Symbolic Instruction Code) with an *explicit, almost *moral* goal: to *democratize* programming, to make it *available to people who were not specialists*, to put a *computer* in the hands of the *general student* \cite{dartmouth}. BASIC is *small*, *simple*, and *forgiving*, and it was the *first* language of a *huge* number of people, from the *Altair* (where **Altair BASIC**, written by Gates and Allen, became Microsoft's *first* product) to the *home computers* of the 1980s \cite{dartmouth}. The *psychology* of BASIC is the *psychology of the teacher*: the *goal* is not *power*, it is *access*; the *measure* of the language is not *what it can do*, it is *how many people can use it*. That *access* philosophy — *that the *value* of a tool is the *number of people* who can use it* — is the *same* philosophy that, decades later, made *Python* the *language* of *machine learning*, and it is a philosophy that *runs directly* into the *natural-language* interface of *modern AI*: the *end goal* of the *access* project is a *computer* that *anyone* can *talk* to. \cite{dartmouth}
</div>

<div class="md">
* **SQL (1974) and the relational model (1970): the language of *data*.** In 1970, **Edgar Codd** at IBM published **“A Relational Model of Data for Large Shared Data Banks”** \cite{codd1970}, which proposed that *all* your data should be stored in *tables* (*relations*), and that you should *query* it with a *logical* language, not with a *program* that *navigates* the *storage*. The language that came out of that idea, **SQL** (Structured Query Language, from IBM's SEQUEL, 1974), is the *language* of *databases*, and the *relational model* is the *model* on which *almost all* modern *data storage* is built \cite{codd1970}. Codd won the **Turing Award** in 1981 for the *model*. The *psychology* of the relational revolution is the *psychology of the *separation* of *what you want* (the *query*) from *how it is stored* (the *implementation*) — the *same* “level of indirection” that runs through the *whole* of software, applied to *data*. And it is *directly* *AI*-relevant: the *relational* idea — *a clean, logical view of the data, independent of the messy storage* — is the *ancestor* of the *vector database* and the *semantic* *index* that a modern retrieval system builds. \cite{codd1970}
</div>

<div class="md">
* **Ada (1980): the language with a *mandate*.** The United States Department of Defense, needing a *single*, *reliable*, *maintainable* language for *safety-critical* systems (the sort of software that flies a plane or aims a missile), commissioned a *language*, and it was named — in a *deliberate* act of *recognition* — after **Ada Lovelace** \cite{chm}. Ada is *boring* in the *best* sense: *explicit*, *checked*, *maintainable*, *safe*. It is the *language* of the *argument* that *software* can be an *engineering* *discipline* (with *standards*, *certification*, *liability*), not just a *craft*, and it is the *flag* of the *software-engineering* *side* of the *field*. \cite{garmisch1968}
</div>

<div class="md">
### The Modern Languages (1990s–now): The Polyglot Era

From the 1990s on, the *number* of *languages* *exploded*, and the *question* changed from “*which* language is *right*?” to “*which* language is *right for this job*?” — the *polyglot* era, in which a single *system* is built from *several* languages, each doing *what it is best at*.

* **Java (1995, Sun).** **James Gosling**'s **Java** was born from the **“Green Project”** (a *home-appliance* computer, code-named **“Oak”**) and re-tooled for the *web* as **“Write Once, Run Anywhere”** \cite{java_oracle}. Its *key* idea is the **JVM** (Java Virtual Machine): a *portable* *machine* that *runs* the *compiled* *Java* *bytecode*, so the *same* *program* runs on *any* *platform* that has the *JVM* \cite{java_oracle}. Java *defined* the *enterprise* *web* of the 2000s, and its *idea* — *a portable runtime, a managed memory, a language that is *safe* by *default* — is the *idea* behind a *whole* family of *managed* languages. \cite{java_oracle}
</div>

<div class="md">
* **Python (1991, Guido van Rossum): the language that *won* machine learning.** **Python** was designed, by **Guido van Rossum**, for *readability* and *pleasure*: “*Readability counts*,” “*Beautiful is better than ugly*” — the language is *explicit* in its *aesthetics*, and its *brevity* means a *program* is *shorter* and *clearer* than the *same* program in *Java* or *C++* \cite{python}. Two facts made Python the *language* of *modern AI*. First, its *readability* and its *batteries-included* culture made it the *first* language a *researcher* (a *scientist*, not a *systems* *programmer*) could *use* to *prototype* an *idea* in an *afternoon* \cite{python}. Second, the *entire* *ecosystem* of *machine-learning* tools — **NumPy**, **SciPy**, **scikit-learn**, **TensorFlow**, **PyTorch** — was *built in Python*, *on top of* C/C++/CUDA *kernels*, so that the *researcher* writes *Python* and the *machine* runs *C* \cite{python}. The *Zen of Python* (**PEP 20**, 2004) is a *poem* of *principles* that *summarizes* the *philosophy* of the language, and the *most* *quoted* *line* — “*There should be one— and preferably only one —obvious way to do it*” — is the *Unix* *philosophy* (*do* one thing, *do* it well, *do* it *one* *way*) *reapplied* to a *language* \cite{python_zen}.
</div>

<div class="optional md" data-headline="“Bikeshedding”: a word Python gave to the world">
Python has a *rich* *culture* of *public* *discussion* (the *mailing* *lists*, the *PEPs*, the *benevolent* *dictator*), and from that culture came a *word* that is now *used* in *every* *engineering* *shop* in the *world*: **“bikeshedding”** \cite{python}. The *joke* is that a *committee* will *spend* *hours* *debating* the *color* of the *bicycle* *shed* (the *trivial*, *visible*, *low-stakes* *decision*) while *ignoring* the *elephant* in the *room* (the *important*, *invisible*, *high-stakes* *one*). The *word* captures a *real* *failure* *mode* of *software* *teams* — that *effort* *flows* to the *easy*, *concrete*, *arguable* *decision*, not to the *hard*, *abstract*, *important* *one* — and it is a *perfect* *metaphor* for the *history* of *software* itself: the *industry* *spends* *enormous* *effort* on the *surface* (the *GUI*, the *syntax*, the *brand*) and *relatively* *little* on the *deep* *structure* (the *kernel*, the *model*, the *proof*). \cite{python}
</div>

<div class="md">
* **JavaScript (1995, Brendan Eich): the language written in *ten days*.** **Brendan Eich** was asked, at **Netscape**, to put a *scripting* language *inside* the *browser*, and he *built* the *first* version of **JavaScript** (originally **“LiveScript”**) in *ten days* in *May 1995* \cite{javascript_mdn}. It was, by *deliberate* *choice*, *loose* (dynamically *typed*, *forgiving*, *quick* to *write*), and it was *rebranded* **“JavaScript”** (the *Java* *name*, for *marketing*, though the *languages* are *unrelated*) \cite{javascript_mdn}. The *irony* is *total*: a *ten-day*, *compromise*, *stopgap* language, built to *ship* a *feature*, became the *most* *deployed* programming language in the *history* of the *world*, the *language* of the *entire* *client* *side* of the *web*, and, through the **Node.js** runtime (2009), the *language* of a *huge* share of the *server* *side* as *well* \cite{javascript_mdn}. JavaScript is the *purest* *example* of a *language* *winning* by *distribution* rather than by *design*: it is not the *best* language, by *most* *measures*, but it is the *language that is *everywhere*, and *everywhere* is a *feature*. \cite{javascript_mdn}
</div>

<div class="md">
* **C# (2000, Microsoft).** **Anders Hejlsberg** (who had also been a key figure in the design of *Turbo Pascal* and in the early *C++*) built **C#** for Microsoft's **.NET** platform as a *synthesis*: the *syntax* and *feel* of *C++*, the *managed* *memory* and *type safety* of *Java*, the *object model* of *both* \cite{csharp_ms}. It is the *language* of the *enterprise* and of the **.NET** ecosystem, and its *design* is a *case study* in *synthesis*: it is a language that *chose* the *best* *idea* from *each* of its *rivals* and *combined* them, and it is a *reminder* that the *history* of *languages* is a *history* of *synthesis* as *much* as of *invention*. \cite{csharp_ms}
</div>

<div class="md">
* **Go (2009, Google): the *boring* language that *won*.** In 2009, **Robert Griesemer**, **Rob Pike**, and **Ken Thompson** (yes, *Ken Thompson*, the *co-creator* of *Unix* and *Plan 9*) designed **Go** at Google \cite{go_lang}. Its *goals* were *deliberately* *anti-clever*: *fast* to *compile*, *simple* to *read*, *built-in* *concurrency* (the *goroutine*, a *lightweight* *thread*), and *no* *hidden* *complexity* \cite{go_lang}. Go is *famous* for being *boring*, and it is *famous* for being *enormously* *successful*: it is the *language* of much of the *infrastructure* of the *cloud*, of *Docker*, of *Kubernetes*, and of a *huge* share of the *systems* that *run* the *data centers* in which *large* *models* are *trained* \cite{go_lang}. The *psychology* of Go is the *psychology* of the *senior* *engineer* who has *seen* *enough* *clever* *languages* to *prefer* the *boring* one: *the* *best* *language* is the *one* *the whole team can read*, and *the* *best* *tool* is the *one* *that gets out of the way*. \cite{go_lang}
</div>

<div class="md">
* **Rust (2010–2015, Graydon Hoare, Mozilla): the language that *solves* the *crash*.** **Rust** was born from a *specific* *obsession*: **memory safety**. A *very large* share of the *world's* *critical* *security* *vulnerabilities* come from *memory* *errors* (the *buffer* *overflow*, the *use-after-free*, the *dangling* *pointer*), and those errors live in the *low-level* languages (C, C++) that *build* the *infrastructure* \cite{rust_lang}. Rust's answer is the **borrow checker**: a *compile-time* *proof* that *no* memory is *used* after it is *freed* and that *no* two things *write* to the *same* memory at the *same* time, *without* a *garbage* *collector* and *without* giving up *speed* \cite{rust_lang}. Rust *refuses to compile* a program that might *crash* or *leak*, which is a *radical* *idea* (a *language* that *says no* to *your* *code*) and a *revolutionary* one (a *systems* language that is *memory-safe* by *construction*). It reached **1.0** in 2015, and it is now the *language* that *governments* and *operating-system* *projects* (including a *large* part of the *modernization* of *Windows* and *Linux* *drivers*) are *choosing* for *new* *safety-critical* *systems* \cite{rust_lang}. The *psychology* of Rust is the *psychology* of the *safety* *engineer*: the *goal* is not *expressiveness*, it is *the absence of a whole class of catastrophic failures*, and the *price* (a *steep* *learning* *curve*, a *compiler* that *argues* with you) is *worth it*. \cite{rust_lang}
</div>

<div class="md">
## The Toolchain: The Software That Builds the Software

A language and an operating system are not *enough* to build a *large* *system*. You also need the *tools* that let a *team* *write*, *build*, *test*, and *maintain* *software* that is *complex* *enough* to be *useful*. These tools are the *most* *underrated* *part* of the *stack*, and they are the *part* that is *most* *directly* *responsible* for making *large* *software* (and therefore *AI*) *possible* at *all*.

### The Compiler, the Assembler, and the “Translator”
We met the *compiler* with *Hopper* (1952). The *assembler* (the *IBM 701* *assembler*, 1952) came *around* the *same* *time*, and it is the *first* *translator*: it *maps* *short* *mnemonics* (`ADD`, `MOV`) to *machine* *code*, so the *programmer* does not have to *write* *binary* \cite{chm}. The *compiler* *generalized* the *idea*: *translate* a *whole* *language*, not just a *shorthand*. And the *optimizing* *compiler* (the *FORTRAN* *optimizer*, the *register* *allocator*, the *peephole* *optimizer*) *added* the *third* *idea*: that the *translator* can *make* the *program* *faster* than the *human* could *have* *written* it *by hand*, by *rearranging* and *simplifying* the *code* \cite{fortran2}. The *compiler* is, in *effect*, the *first* *AI* *in* the *stack*: a *program* that *reads* a *human's* *intent* (the *source*) and *produces* a *different*, *better*, *machine* *form* of it, *automatically*. The *entire* *idea* of a *model* that *transforms* an *input* into a *better* *output* is *prefigured* in the *compiler*. \cite{chm}
</div>

<div class="md">
### `make`: The “Build” That Runs Itself (1976)
In **1976**, **Stewart Kafka** at Bell Labs wrote **`make`**, a *tool* that *answers* the *question* “*what* *needs* to be *rebuilt*?” \cite{gnu_make}. A *large* program is a *graph* of *dependencies*: file *C* depends on file *B*, which depends on file *A*. When you *change* *A*, you must *rebuild* *B* and *C* (but *not* the *fifty* other files that *do not* depend on *A*). `make` reads a *description* of that *graph* (a *Makefile*) and *works out*, *automatically*, the *minimal* set of *things* to *rebuild*, and *builds* them *in* the *right* *order* \cite{gnu_make}. It is a *small* *program*, and it is *one* of the *most* *important* *tools* in the *history* of *software*, because it is the *first* *tool* that *treated* the *build* *process* as a *computable* *problem* (a *graph* *traversal*) rather than a *manual* *chore*. Every *build* *system* since (**CMake**, **Bazel**, the *build* systems of *TensorFlow* and *PyTorch*) is a *descendant* of `make`, and the *idea* — *the* *build* is a *graph*, and the *graph* can be *solved* — is the *idea* that makes *building* a *large* *software* *system* (a *model*, a *framework*, a *compiler* *itself*) *tractable* \cite{gnu_make}.
</div>

<div class="md">
### Version Control: The “Team” That Never Collides (1972–2005)
The *single* *greatest* *barrier* to *large* *software* is not the *machine*; it is the *team*. If *ten* *people* edit the *same* *code*, they *collide*: they *overwrite* each other, they *lose* each other's *changes*, they *cannot* say *what* *changed* *and* *when* and *why*. The *answer* is **version control**: a *system* that *keeps* *every* *version* of *every* *file*, *records* *who* *changed* *what* and *when*, and lets *people* *work* on the *same* *code* *at the same time* without *destroying* each other \cite{git}.

The *lineage* is a *beautiful* *one*: **SCCS** (1972, **Marc Rochkind**, Bell Labs) was the *first* *serious* *system*; **RCS** (1982, **Troy Armstrong**) *refined* it; **CVS** (1986, **Greg Stein**) made it *networked* (so a *team* across the *world* could *share* a *repository*); **Subversion** (2000, **CollabNet**) *simplified* it; and **Git** (2005, **Linus Torvalds**) *revolutionized* it \cite{git}. Git was *born* of a *specific* *fight*: the *Linux* *kernel* *team* had been *using* a *proprietary* *tool* (**BitKeeper**), and when the *license* was *withdrawn*, Torvalds *built* a *replacement* in a *matter of weeks*, *designed* around *one* *radical* *idea*: that *every* *developer* has a *complete, local* *copy* of the *entire* *history*, and that *commits* are *local* and *fast*, and *sharing* is an *explicit* act \cite{git}. Git is now the *universal* *version* control *system*, and it is *directly* *responsible* for the *way* *modern* *software* — and *modern* *AI* — is *developed*: the *open*, *distributed*, *collaborative* *development* of a *large* *system* by *hundreds* of *people* *at once* is *only* *possible* because of *Git*. \cite{git}
</div>

<div class="optional md" data-headline="“Git” is a self-deprecating joke">
The name **Git** is, by the *creator's* *own* *admission*, a *self-deprecating* *joke*: in *British* *slang*, “git” is a *word* for a *fool*, and **Linus Torvalds** — who is *not* *shy* about his *opinions* — *chose* it *deliberately*, in the *spirit* of the *project* (a *tool* built by the *people* who *use* it, *for* the *people* who *use* it, *without* *permission* or *patronage*) \cite{git}. The *joke* is *typical* of the *open-source* *ethos*: the *tool* is *named* after the *user's* *imperfection* (the *bug*, the *mistake*, the *foolish* *commit*), because the *whole* *point* of the *system* is that *everyone* *makes* *mistakes*, and the *system* *exists* to make the *mistakes* *reversible* and *visible*. A *version* *control* *system* is, in *effect*, a *machine* for *forgiving* *human* *error*, and that is *exactly* the *role* that *software* — the *whole* *stack* of it — has *always* *played* in *relation* to the *human* *who uses it*: it *absorbs* the *error*, it *keeps* the *record*, it *lets* the *human* *try again*. \cite{git}
</div>

<div class="md">
## What Was Required, in the End, for a Human to Build Something Like Today's AI

Pull the *threads* together, and a *clear* *answer* emerges to the *question* the [Intro](intro) *posed*: *what* had to be *true* about the *world*, and about *human* *society*, before a *machine* could *learn* to *write*?

First, the *machine* had to be *cheap* *enough* to be *shared* and *many* (the *transistor*, the *microprocessor*), and *fast* *enough* to be *useful* (Moore's Law, the *GPU*). Second, the *machine* had to *manage itself* (the *operating system*), so that a *human* did not have to *babysit* it. Third, the *human* had to be able to *talk* to it in a *language* that was *close to the problem*, not close to the *wires* (the *high-level* language), and to *share* and *reuse* the *answers* (the *library*, the *framework*). Fourth, a *team* had to be able to *build* and *keep* a *system* *large* *enough* to be *smart* (the *compiler*, `make`, *version* control). And *fifth* — and this is the *one* that is *easiest* to *forget* — the *idea* had to exist, *before* the *technology* caught up, that the *computer* is a *tool for extending the human mind*, not a *calculator*: the *idea* that was *stated* by **Licklider** in **“Man–Computer Symbiosis”** (1960) \cite{licklider}, by **McCarthy** in *1959*, by **Kay** in the *Dynabook* in *1968*, and by *a* *hundred* *other* *minds* in the *intervening* years.

The *operating system*, the *language*, the *toolchain*: these are the *displaced* *prerequisites* of *AI*, in exactly the *sense* of the [Untold History](untold_history) chapter. They were *built* to *solve* *problems* that had *nothing* to do with *intelligence* (scheduling a *factory*, translating a *notation*, keeping a *team* from *colliding*), and *yet* every *one* of them is a *load-bearing* *fact* of *modern* *machine* *learning*. Remove the *operating system* and there is no *way* to *run* a *model* on a *many-core* *machine*. Remove the *compiler* and there is no *way* to *turn* a *researcher's* *Python* into *GPU* *kernels*. Remove *version* control and there is no *way* for the *hundreds* of *people* who *build* a *frontier* *model* to *work* *together*. Remove the *language* and there is no *way* for a *scientist* to *prototype* an *idea*. The *stack* is *not* a *coincidence*; it is the *necessary* *scaffolding* on which the *model* *stands*.
</div>

<div class="image-row">
	<figure>
		<img src="margaret_hamilton.jpg" alt="Margaret Hamilton" />
		<figcaption class="md">Margaret Hamilton, whose work on the Apollo flight software is one of the founding acts of *software engineering* as a discipline.</figcaption>
	</figure>
	<figure>
		<img src="apollo_agc_modules.jpg" alt="Apollo AGC software modules" />
		<figcaption class="md">Apollo AGC software modules. The flight software had to *detect and recover* from *errors* in *real time*, on a machine with *less memory than a modern calculator*.</figcaption>
	</figure>
</div>

<div class="md">
### “Software Engineering”: The Moment Software Became a *Discipline*
The word **“software engineering”** was *coined* at the **1968** **Garmisch** conference (the *First International Conference on Software Engineering*), where the *participants* — many of them *watching* the *Apollo* program — agreed that *software* had grown *too* *large* and *too* *important* to be a *craft*, and that it needed to be an *engineering* *discipline*, with *methods*, *standards*, and *measures* \cite{garmisch1968}. The *person* most *associated* with *making* that *idea* *real* is **Margaret Hamilton**, whose team wrote the **Apollo** *Guidance* *Computer*'s *flight* *software* — a *system* that had to *detect* its *own* *errors* and *recover*, *in flight*, on a machine with *less* memory than a *pocket* *calculator* \cite{chm}. The *famous* *photograph* of *Hamilton* *standing* beside a *pyramid* of *punch* *cards* (the *entire* *Apollo* *AGC* *software*, *stacked*) is *one* of the *icons* of the *field*, and the *idea* it *embodies* — that *software* is a *serious*, *measurable*, *engineerable* *thing*, with *failure* *modes* that must be *designed* *against* — is the *idea* that *underlies* the *entire* *modern* *practice* of *building* *reliable* *large* *systems*, *including* the *training* and *deployment* of *large* *models*. \cite{garmisch1968}
</div>

<div class="optional md" data-headline="The 72-card pyramid">
The *pyramid* *photo* is *often* *described* as showing “*72,000 lines of code in 72 kilobytes*,” and the *numbers* are *broadly* *right* in *spirit* if not in *detail*: the *Apollo* *AGC* *software* was *enormous* *for* its *hardware*, and *Hamilton's* *team* had to *invent* *most* of the *techniques* of *real-time*, *fault-tolerant*, *resource-constrained* *software* *from scratch*, because there *was no* *prior* *art* \cite{chm}. The *deeper* *point* is *not* the *lines of code*; it is that *Hamilton* *treated* the *software* as a *first-class* *engineering* *artifact*, with a *name* (“*software* *engineering*”), a *method*, and a *standard of proof* (the *system* must *be* *able* to *prove* that it *will not* *fail* *in* a *way* that *kills* the *astronauts*). That *attitude* — *that* the *code* is a *load-bearing* *structure*, and that *its* *correctness* is a *matter of* *life and death* — is the *attitude* that *modern* *AI* *safety* is *only now* *beginning* to *adopt*. \cite{chm}
</div>

<div class="md">
## The Ideas and the Minds: The Geist of the Software

The *technical* history — the *OSes*, the *languages*, the *tools* — is the *skeleton*. The *flesh* is the *history of the ideas* and the *psychology of the people* who *fought* over them, and it is the *part* that *explains* *why* the *stack* has the *shape* it *does*.

### The Great Arguments
Software is *defined* by its *arguments*. There is no *area* of it in which the *right* *answer* was *obvious*, and the *shape* of the *modern* *stack* is the *shape of the* *arguments* that were *won* (or *left* *unresolved*).

* **Monolithic versus microkernel.** *Should* the *kernel* be a *big* *monolith* (fast, but *hard* to *verify*) or a *small* *microkernel* (clean, but *slower*)? Fought by **Tanenbaum** and **Lampson** in the 1980s, *resolved* (in *practice*) by the *hybrid* \cite{chm}.
* **Top-down versus bottom-up.** *Should* you *design* the *whole* *system* *first* (the *Multics* *way*, the *comprehensive* *specification*) or *build* it *in* *small*, *composable* *pieces* (the *Unix* *way*, the *“do one thing well”*)? The *Unix* *way* *won* the *operating system* *war*, and it is the *way* that *most* *modern* *software* is *built* \cite{unix_ts}.
* **Open versus closed.** *Should* the *code* be *free* to *read* and *modify* (the *Unix* *BSD* *camp*, the *free-software* *movement*, *open* *source*), or *proprietary* (the *System V* *camp*, the *commercial* *empire*)? The *answer* is *both*, in a *tension* that *has never* been *resolved* and that *defines* the *industry* \cite{chm}.
* **Purity versus pragmatism.** *Should* the *language* be *pure* and *provable* (the *functional* *camp*, *Haskell*) or *pragmatic* and *powerful* (the *systems* *camp*, *C* and *C++)*? The *answer* is *a* *spectrum*, and the *spectrum* is the *whole* *space* of *languages* \cite{haskell}.

### The Psychology of the Builders
The *people* matter as *much* as the *ideas*, because the *ideas* were *carried* by *specific* *minds* with *specific* *temperaments*:

* **Dennis Ritchie** was the *quiet* *perfectionist*. He *built* *C* and *Unix* with a *minimalism* that was *almost* *aesthetic*: the *fewest* *keywords*, the *smallest* *kernel*, the *cleanest* *interface*. His *style* is the *style* of the *Unix* *philosophy* made *flesh* \cite{unix_ts}.
* **Ken Thompson** was the *hacker* *for* *whom* the *work* was the *pleasure*. *“If it is not fun, it is not worth doing”* is *his* *creed*, and *Unix*, *Plan 9*, *Go* — all of it — is the *work* of a *man* who *built* *systems* because *building* *systems* was *fun* \cite{bell_labs}.
* **Grace Hopper** was the *saleswoman* for the *idea* that the *machine* should *speak* *English*. She *built* the *first* *compiler*, but she *sold* the *idea* of *machine-independent* *programming* to a *world* that *did not* *believe* it *yet* \cite{chm}.
* **John McCarthy** was the *logician* who *predicted* *machine* *intelligence* as a *matter of course*, in *1959*, and *built* the *language* (*Lisp*) in which that *prediction* was *first* *programmed* \cite{lispworks}.
* **Alan Kay** was the *visionary* who *sketched* the *personal*, *graphical*, *learning* *computer* in *1968* and *built* a *prototype* of it in *1973*, *twenty* *years* before the *market* *was ready* \cite{smalltalk}.
* **Bjarne Stroustrup** was the *pragmatist* who *refused* to *choose* between *power* and *convenience*, and *paid* for it in *complexity* \cite{isocpp}.
* **Niklaus Wirth** was the *pedagogue* who *believed* that a *language* should be *small enough to be understood*, and who *built* *Pascal* to *prove* it \cite{pascal}.
* **Richard Stallman** was the *ideologist* for whom the *freedom* of the *software* was the *point*, and who *built* the *GNU* *Hurd* as a *monument* to that *idea*, *whether* or not it *ever* *became* the *default* \cite{gnu_hurd}.
* **Linus Torvalds** was the *pragmatist* *organizer* who *proved* that a *large* *system* (the *Linux* *kernel*, *Git*, and, through them, much of the *infrastructure* of *modern* *AI*) could be *built* by a *distributed*, *open*, *ruthlessly* *meritocratic* *team*, and who *named* his *tool* after the *user's* *foolishness* \cite{git}.
</div>

<div class="md">
### The Hacker Ethic and the Gift Economy
Running through all of this is a *distinctive* *psychology*, the **hacker ethic**: the *belief* that *information* should be *free*, that *software* should be *shared* and *improved* by *everyone*, that the *measure* of a *programmer* is the *quality* of the *work* (not the *title* or the *institution*), and that the *intrinsic* *pleasure* of *making a clever, working thing* is a *legitimate*, even *primary*, motivation \cite{bell_labs}. This *ethic* is the *engine* of the *open* *side* of *software*: of *Unix* (*given away* by *Bell Labs*), of *open source* (*Linux*, *Git*, *the* *web* *browser*), of *free* *software* (*GNU*, *the* *Hurd*), and — *directly* — of the *open* *model* *movement* in *AI* (*the* *open-weights* *models*, *the* *open* *frameworks*, *the* *public* *datasets*). The *hacker ethic* is the *cultural* *prerequisite* of *open* *AI*, in exactly the *way* that the *operating system* is the *technical* *prerequisite*: without the *belief* that *sharing* the *work* *makes* it *better*, there is no *open* *ecosystem*, and without the *open* *ecosystem*, the *pace* of *progress* in *AI* would have been *slower* by an *order* of *magnitude*. \cite{bell_labs}
</div>

<div class="md">
## The Thread That Runs All the Way Down

Look at the *whole* *ladder* again, from the *bottom* up, and the *shape* of it is *not* *accidental*. It is the *shape* of the *idea* that **computation is the manipulation of symbols**, *stated* by **Leibniz**, *proved* by **Turing**, *built* by **Ritchie** and *the* *Unix* *group*, *expressed* in *a* *hundred* *languages*, *managed* by *a* *hundred* *operating* *systems*, and *finally* — *in* the *model* — *turned back on itself*: a *system* of *symbol* *manipulation* that *learns* *the* *rules* of *symbol* *manipulation* from *the* *data*, instead of *having them written down*.

The *operating system* *abstracts* the *machine*. The *language* *abstracts* the *operating system*. The *framework* *abstracts* the *language*. The *model* *abstracts* the *data*. And the *user* — the *human* who *types* a *sentence* into a *chat* *box* — is *abstracted* from *all* of it, *standing* at the *top* of the *ladder*, *speaking* to a *machine* in *the* *only* *language* that *has never* *needed* a *compiler*: *the* *human* *one*. Every *rung* of the *ladder* was *built* by a *rival* *mind* who *believed* that *their* *abstraction* was the *right* *one*, and *the* *stack* is the *record* of *which* *abstractions* *survived* the *competition*. That is the *deep* *lesson* of the *whole* *page*, and it is the *lesson* that *belongs* in the *mind* *chapter* alongside it: **without the competition, there is no ladder, and without the ladder, there is no AI.**
</div>
