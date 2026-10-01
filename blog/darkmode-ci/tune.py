#!/usr/bin/env python3
import json, math
DEG=math.pi/180
def ll2v(lat,lng,r):
    phi=(lng+180)*DEG; th=(90-lat)*DEG; st=math.sin(th)
    return (-r*st*math.cos(phi), r*math.cos(th), r*st*math.sin(phi))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
def norm(a):
    l=math.sqrt(dot(a,a)); return(1,0,0) if l<1e-9 else (a[0]/l,a[1]/l,a[2]/l)
def cam(th,ph,d):
    sp=math.sin(ph); return (d*sp*math.cos(th),d*math.cos(ph),d*sp*math.sin(th))
def occluded(P,C):
    D=(P[0]-C[0],P[1]-C[1],P[2]-C[2]);a=dot(D,D);b=2*dot(C,D);c=dot(C,C)-1
    disc=b*b-4*a*c
    if disc<0:return False
    s=(-b-math.sqrt(disc))/(2*a);return 0<s<1
def slerpdir(a3,b3,ang,tt):
    s1=math.sin((1-tt)*ang)/math.sin(ang or 1e-6); s2=math.sin(tt*ang)/math.sin(ang or 1e-6)
    return norm(tuple(a3[j]*s1+b3[j]*s2 for j in range(3)))
ents={e['id']:e for e in json.load(open('atlas/entities.json')) if e.get('lat') is not None}
thrs=json.load(open('atlas/threads.json'))
def arc_samples(C, lift, base, tip, t):
    """yield (P, visibleHemi) for each sample of each segment of thread t.
    tip: extra radius at the very endpoints (t=0,1) so the line clears the surface."""
    k=t.get('kind','influence'); L=(0.9 if k=='signal' else 0.5)*lift
    if k=='journey':
        nodes=[t.get('person')]+list(t.get('path',[])); pairs=[(nodes[i],nodes[i+1]) for i in range(len(nodes)-1)]
    else: pairs=[(t.get('from'),t.get('to'))]
    for (f,to) in pairs:
        A=ents.get(f);B=ents.get(to)
        if not A or not B:continue
        a3=ll2v(A['lat'],A['lng'],1); b3=ll2v(B['lat'],B['lng'],1)
        ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
        for i in range(65):
            tt=i/64
            # elevation profile: base floor + bulge + tip lift at both ends
            tiplift = tip*(max(0,1-8*tt)+max(0,8*tt-7))   # ramps over outer ~12% each end
            r=1+base+L*ang*math.sin(math.pi*tt)+tiplift
            p=slerpdir(a3,b3,ang,tt); P=tuple(p[j]*r for j in range(3))
            vis = dot(norm(p),norm(C))>0   # front (visible) hemisphere
            yield P,vis,occluded(P,C)
def metric(C,lift,base,tip):
    vis=0; hidden=0
    for t in thrs:
        for (P,v,o) in arc_samples(C,lift,base,tip,t):
            if v:
                vis+=1
                if o: hidden+=1
    return (hidden/vis if vis else 0.0), vis
cams=[('default',-0.4,1.15,3.2),('front',0.0,1.2,3.2),('east',1.57,1.3,3.2),
      ('west',-1.57,1.3,3.2),('north',0.3,0.5,3.2),('low',0.5,1.85,3.2),
      ('far',0.0,1.2,20.0)]
print('metric = fraction of FRONT-hemisphere arc samples that are hidden (the bug). want ~0')
print(f'{"cam":8s} {"lift":>5} {"base":>5} {"tip":>5}  hidden/visible')
for name,th,ph,d in cams:
    C=cam(th,ph,d)
    for (lift,base,tip) in [(1.0,0.01,0.0),(1.5,0.03,0.05),(2.0,0.05,0.08),(2.5,0.06,0.12),(3.0,0.08,0.16),(4.0,0.10,0.20)]:
        h,v=metric(C,lift,base,tip)
        print(f'{name:8s} {lift:5.1f} {base:5.2f} {tip:5.2f}  {h:.3f}  ({v} vis)')
    print()
