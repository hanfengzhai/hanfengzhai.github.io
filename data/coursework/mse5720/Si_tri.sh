#!/bin/bash
#SBATCH -J Si        # Job Name
#SBATCH -o Si.o%j    # Name of the error and output files (%j appends the jobID)
#SBATCH -N 1             # Requests nodes
#SBATCH -n 25            # Requests number of tasks, in multiples of 64
#SBATCH -p development   # Queue name: development (max 2 hr walltime) or normal
#SBATCH -t 01:00:00      # Run time (hh:mm:ss)
#SBATCH -A TG-MPS150006

module load intel/19.1.1
module load impi/19.0.7
module load mvapich2/2.3.6
module load qe/7.0


eta_tri_list_1="-0.0015 -0.0010 -0.0005 0.0000 0.0005 0.0010 0.0015"
eta_tri_list_2="0.0015 0.0010 0.0005 0.0000 -0.0005 -0.0010 -0.0015"
eta_list="0.4985 0.4990 0.4995 0.5000 0.5005 0.5010 0.5015"

set $eta_tri_list_1
set $eta_tri_list_2
for eta in $eta_list
do
cat > Si_tri.cell_$eta.in << EOF
&CONTROL
 calculation = 'relax',
 restart_mode = 'from_scratch',
 prefix='Si_elastic_isotropic',
 pseudo_dir='./',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=0,
 celldm(1)=10.19d0,
 nat=2,
 ntyp=1,
 ecutwfc=30,
 occupations = 'fixed',
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
Si 28.0855d0 Si_LDA.UPF

ATOMIC_POSITIONS crystal
Si 0.d0 0.d0 0.d0
Si 0.25d0 0.25d0 0.25d0

K_POINTS automatic
  9 9 9 0 0 0

CELL_PARAMETERS alat 
-0.5 $1 0.5
$2 0.5 0.5
-$eta $eta 0.d0
EOF

pw.x < Si_tri.cell_$eta.in > Si_tri.cell_$eta.out # Run the executable named pw.x 
shift
done
